Create a new native web component.

Arguments: $ARGUMENTS (component name in kebab-case)

1. Create `src/components/$ARGUMENTS.js` extending HTMLElement
2. Use Shadow DOM for style encapsulation
3. Register as `cert-$ARGUMENTS` via `customElements.define`
4. Add JSDoc with @element, @fires, @attr tags
5. Create `src/components/$ARGUMENTS.test.js` with basic lifecycle tests
6. Add named export to `src/components/index.js`
