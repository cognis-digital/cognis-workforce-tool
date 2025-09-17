import PolymorphicCodeGenerator from '../codegen/polymorphicGenerator';

describe('PolymorphicCodeGenerator', () => {
  const generator = new PolymorphicCodeGenerator({
    outputPath: './src/generated',
    prettierConfig: { 
      semi: true, 
      singleQuote: true 
    }
  });

  it('should generate code from a template', async () => {
    // Register a test template
    generator.registerTemplate({
      name: 'testComponent',
      getTemplate: (data) => `
        import React from 'react';

        export function ${data.componentName}(props) {
          return (
            <div className="${data.className}">
              <h2>${data.title}</h2>
              <p>${data.description}</p>
            </div>
          );
        }
      `
    });
    
    interface TestComponentData {
      componentName: string;
      className: string;
      title: string;
      description: string;
    }
    
    const testData: TestComponentData = {
      componentName: 'TestComponent',
      className: 'test-component',
      title: 'Test Title',
      description: 'Test Description'
    };
    
    const code = await generator.generateCode('testComponent', testData);
    
    // Type assertion for Jest's expect
    const expectString = (value: string) => ({
      toContain: (substring: string) => expect(value.includes(substring)).toBe(true),
      toBe: (expected: string) => expect(value === expected).toBe(true)
    });
    
    expectString(code).toContain('import React');
    expectString(code).toContain('export function TestComponent');
    expectString(code).toContain('<div className="test-component">');
    expectString(code).toContain('<h2>Test Title</h2>');
    expectString(code).toContain('<p>Test Description</p>');
  });

  it('should generate TypeScript type definitions from state objects', () => {
    const testState = {
      counter: 42,
      text: 'hello',
      nested: {
        value: true,
        items: ['a', 'b', 'c']
      },
      nullValue: null
    };
    
    const typeDefs = generator.generateTypesFromState(testState, 'TestState');
    
    // Using our custom typed expect wrapper
    expectString(typeDefs).toContain('export interface TestState');
    expectString(typeDefs).toContain('counter: number;');
    expectString(typeDefs).toContain('text: string;');
    expectString(typeDefs).toContain('export interface TestStateNested');
    expectString(typeDefs).toContain('value: boolean;');
    expectString(typeDefs).toContain('items: string[];');
    expectString(typeDefs).toContain('nullValue: null | undefined;');
  });
});
