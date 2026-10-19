package com.template.app.service;

import com.template.app.dto.LearningDtos.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class QuestionImportService {
    private static final Pattern NUMBERED_QUESTION = Pattern.compile("(?m)^\\s*(\\d{1,3})[.)]\\s+.*$");
    private static final Pattern OPTION_LINE = Pattern.compile("^\\s*([A-F])[.)]\\s*(.*)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER_LINE = Pattern.compile("^\\s*(?:correct\\s+)?answer(?:\\s+key)?\\s*[:\\-]\\s*([A-F])\\b.*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern EXPLANATION_LINE = Pattern.compile("^\\s*(?:explanation|solution)\\s*[:\\-]\\s*(.*)$", Pattern.CASE_INSENSITIVE);

    public QuestionImportPreview preview(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Choose a non-empty file to import.");
        if (file.getSize() > 10L * 1024 * 1024) throw new IllegalArgumentException("Import files must be 10 MB or smaller.");
        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
        try {
            List<QuestionImportDraft> questions;
            if (name.endsWith(".pdf")) questions = parsePdf(file.getBytes());
            else if (name.endsWith(".csv")) questions = parseCsv(file.getBytes());
            else if (name.endsWith(".xlsx")) questions = parseXlsx(file.getInputStream());
            else throw new IllegalArgumentException("Use a PDF, CSV, or XLSX file.");
            if (questions.isEmpty()) throw new IllegalArgumentException("No question rows were found in this file.");
            if (questions.size() > 500) throw new IllegalArgumentException("A single import can contain at most 500 questions.");
            return new QuestionImportPreview(questions, List.of());
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("The file could not be read. Check that it is a valid PDF, CSV, or XLSX file.");
        }
    }

    private List<QuestionImportDraft> parseCsv(byte[] bytes) throws IOException {
        String csv = new String(bytes, StandardCharsets.UTF_8);
        if (!csv.isEmpty() && csv.charAt(0) == '\uFEFF') csv = csv.substring(1);
        List<List<String>> records = readCsv(csv);
        if (records.isEmpty()) return List.of();
        List<String> headers = records.get(0).stream().map(this::normalizeHeader).toList();
        if (!headers.contains("prompt") && !headers.contains("question")) {
            throw new IllegalArgumentException("The spreadsheet needs a prompt or question column.");
        }
        List<QuestionImportDraft> result = new ArrayList<>();
        for (int i = 1; i < records.size(); i++) {
            List<String> row = records.get(i);
            if (row.stream().allMatch(String::isBlank)) continue;
            result.add(fromCells(headers, row, "row " + (i + 1)));
        }
        return result;
    }

    private List<QuestionImportDraft> parseXlsx(InputStream input) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(input)) {
            if (workbook.getNumberOfSheets() == 0) return List.of();
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() == 0) return List.of();
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            List<String> headers = new ArrayList<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                headers.add(normalizeHeader(formatter.formatCellValue(headerRow.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK))));
            }
            if (!headers.contains("prompt") && !headers.contains("question")) {
                throw new IllegalArgumentException("The spreadsheet needs a prompt or question column.");
            }
            List<QuestionImportDraft> result = new ArrayList<>();
            for (int r = headerRow.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                List<String> cells = new ArrayList<>();
                for (int c = 0; c < headers.size(); c++) {
                    cells.add(formatter.formatCellValue(row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK)));
                }
                if (cells.stream().allMatch(String::isBlank)) continue;
                result.add(fromCells(headers, cells, "row " + (r + 1)));
            }
            return result;
        }
    }

    private List<QuestionImportDraft> parsePdf(byte[] bytes) throws IOException {
        String text;
        try (PDDocument document = Loader.loadPDF(bytes)) {
            text = new PDFTextStripper().getText(document);
        }
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("This PDF has no selectable text. Scanned PDFs are not supported yet.");
        }
        Matcher starts = NUMBERED_QUESTION.matcher(text);
        List<Integer> offsets = new ArrayList<>();
        while (starts.find()) offsets.add(starts.start());
        if (offsets.isEmpty()) throw new IllegalArgumentException("No numbered questions were found in the PDF.");
        List<QuestionImportDraft> result = new ArrayList<>();
        for (int i = 0; i < offsets.size(); i++) {
            int end = i + 1 < offsets.size() ? offsets.get(i + 1) : text.length();
            String block = text.substring(offsets.get(i), end).trim();
            result.add(parsePdfQuestion(block, i + 1));
        }
        return result;
    }

    private QuestionImportDraft parsePdfQuestion(String block, int number) {
        String[] lines = block.split("\\R");
        List<OptionInput> options = new ArrayList<>();
        List<String> promptLines = new ArrayList<>();
        StringBuilder explanation = new StringBuilder();
        String correct = "";
        String activeOption = null;
        boolean inOptions = false;
        boolean inExplanation = false;
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty()) continue;
            Matcher answer = ANSWER_LINE.matcher(line);
            Matcher explanationStart = EXPLANATION_LINE.matcher(line);
            Matcher option = OPTION_LINE.matcher(line);
            if (answer.matches()) {
                correct = answer.group(1).toUpperCase(Locale.ROOT);
                activeOption = null;
                inExplanation = false;
                continue;
            }
            if (explanationStart.matches()) {
                inExplanation = true;
                activeOption = null;
                if (!explanationStart.group(1).isBlank()) explanation.append(explanationStart.group(1).trim());
                continue;
            }
            if (inExplanation) {
                if (!explanation.isEmpty()) explanation.append('\n');
                explanation.append(line);
                continue;
            }
            if (option.matches()) {
                inOptions = true;
                activeOption = option.group(1).toUpperCase(Locale.ROOT);
                options.add(new OptionInput(activeOption, option.group(2).trim()));
                continue;
            }
            if (inOptions && activeOption != null) {
                int last = options.size() - 1;
                OptionInput previous = options.get(last);
                options.set(last, new OptionInput(previous.key(), (previous.content() + " " + line).trim()));
            } else {
                String promptLine = line.replaceFirst("^\\d{1,3}[.)]\\s*", "");
                promptLines.add(promptLine);
            }
        }
        return validateDraft(String.join(" ", promptLines).trim(), null,
                explanation.isEmpty() ? null : explanation.toString(), correct,
                1, "MEDIUM", options, "question " + number);
    }

    private QuestionImportDraft fromCells(List<String> headers, List<String> cells, String source) {
        Map<String, String> values = new HashMap<>();
        for (int i = 0; i < Math.min(headers.size(), cells.size()); i++) values.put(headers.get(i), cells.get(i).trim());
        String prompt = values.getOrDefault("prompt", values.getOrDefault("question", ""));
        String correct = values.getOrDefault("correctoption", values.getOrDefault("answer", ""));
        List<OptionInput> options = new ArrayList<>();
        for (String key : List.of("A", "B", "C", "D", "E", "F")) {
            String value = values.getOrDefault("option" + key.toLowerCase(Locale.ROOT), values.getOrDefault(key.toLowerCase(Locale.ROOT), ""));
            if (!value.isBlank()) options.add(new OptionInput(key, value));
        }
        Integer marks = parseInteger(values.get("marks"), 1);
        String difficulty = values.getOrDefault("difficulty", "MEDIUM").toUpperCase(Locale.ROOT);
        return validateDraft(prompt, values.get("imageurl"), values.get("explanation"), correct,
                marks, difficulty, options, source);
    }

    private QuestionImportDraft validateDraft(String prompt, String imageUrl, String explanation,
                                              String correct, Integer marks, String difficulty,
                                              List<OptionInput> options, String source) {
        List<String> errors = new ArrayList<>();
        if (prompt == null || prompt.isBlank()) errors.add("Question text is missing.");
        if (options == null || options.size() < 2 || options.size() > 6) errors.add("Add between 2 and 6 options.");
        String answer = correct == null ? "" : correct.trim().replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
        Set<String> keys = options == null ? Set.of() : options.stream().map(o -> o.key().toUpperCase(Locale.ROOT)).collect(java.util.stream.Collectors.toSet());
        if (answer.isBlank() || !keys.contains(answer)) errors.add("Select a correct option in the preview.");
        if (marks == null || marks < 1) errors.add("Marks must be at least 1.");
        if (difficulty == null || !Set.of("EASY", "MEDIUM", "HARD").contains(difficulty.toUpperCase(Locale.ROOT))) errors.add("Choose Easy, Medium, or Hard.");
        return new QuestionImportDraft(prompt == null ? "" : prompt.trim(), emptyToNull(imageUrl), emptyToNull(explanation),
                answer, marks == null || marks < 1 ? 1 : marks,
                difficulty == null || difficulty.isBlank() ? "MEDIUM" : difficulty.toUpperCase(Locale.ROOT),
                options == null ? List.of() : options, source, errors);
    }

    private List<List<String>> readCsv(String text) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (ch == '"') {
                if (quoted && i + 1 < text.length() && text.charAt(i + 1) == '"') { cell.append('"'); i++; }
                else quoted = !quoted;
            } else if (ch == ',' && !quoted) {
                row.add(cell.toString()); cell.setLength(0);
            } else if ((ch == '\n' || ch == '\r') && !quoted) {
                if (ch == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
                row.add(cell.toString()); cell.setLength(0);
                rows.add(row); row = new ArrayList<>();
            } else cell.append(ch);
        }
        if (!cell.isEmpty() || !row.isEmpty()) { row.add(cell.toString()); rows.add(row); }
        return rows;
    }

    private String normalizeHeader(String header) { return header == null ? "" : header.replaceAll("[^A-Za-z]", "").toLowerCase(Locale.ROOT); }
    private Integer parseInteger(String value, Integer fallback) {
        if (value == null || value.isBlank()) return fallback;
        try { return Integer.parseInt(value.trim()); } catch (NumberFormatException ex) { return null; }
    }
    private String emptyToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
