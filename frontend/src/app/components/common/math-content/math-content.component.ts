import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

@Component({
  selector: 'app-math-content',
  standalone: true,
  template: '<div class="math-content" [innerHTML]="rendered()"></div>',
  styles: [':host{display:block;min-width:0}.math-content{white-space:normal;overflow-wrap:anywhere}'],
})
export class MathContentComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly text = input<string>('');
  readonly rendered = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.render(this.text())));

  private render(value: string): string {
    const escaped = (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const token = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+)\$/g;
    let output = '';
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = token.exec(escaped)) !== null) {
      output += escaped.slice(cursor, match.index).replace(/\n/g, '<br>');
      const display = match[1] !== undefined || match[2] !== undefined;
      const expression = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
      output += katex.renderToString(expression, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore' });
      cursor = match.index + match[0].length;
    }
    output += escaped.slice(cursor).replace(/\n/g, '<br>');
    return output;
  }
}
