export class RuleEngine {
  private rules: string[];

  constructor(rules: string[]) {
    this.rules = rules;
  }

  getRulesForLanguage(_language: string): string[] {
    // TODO: Implement language-specific rule filtering
    return this.rules;
  }
}
