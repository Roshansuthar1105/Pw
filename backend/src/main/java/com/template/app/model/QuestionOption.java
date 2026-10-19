package com.template.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionOption {
    @Column(name = "option_key", nullable = false, length = 1)
    private String key;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
}
