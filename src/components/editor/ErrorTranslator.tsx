'use client';

import React from 'react';
import { AlertCircle, Lightbulb, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorTranslation {
  friendlyMessage: string;
  explanation: string;
  example?: string;
  fix?: string;
}

const errorTranslations: Record<string, ErrorTranslation> = {
  // Python errors
  'SyntaxError: invalid syntax': {
    friendlyMessage: 'It looks like you wrote something the computer did not understand.',
    explanation: 'A SyntaxError means you broke the grammar rules of the programming language. It is like saying "apple eat" instead of "eat apple" — the computer cannot figure out what you mean.',
    example: 'You might have forgotten a colon (:) after an if statement, or a closing parenthesis.',
    fix: 'Look at the line highlighted by the error. Check for: missing colons, mismatched parentheses, missing quotes, or incorrect indentation.',
  },
  'SyntaxError: EOL while scanning string literal': {
    friendlyMessage: 'You forgot to close a quote!',
    explanation: 'Strings need quotes at both the beginning and end. The computer read your text but never found the closing quote mark.',
    example: `print("Hello)  # Missing closing quote`,
    fix: 'Add the missing closing quote at the end of your text.',
  },
  'SyntaxError: unexpected EOF while parsing': {
    friendlyMessage: 'Your code seems incomplete.',
    explanation: 'EOF means "End of File". The computer reached the end of your code but expected to find more — like a sentence that trails off without ending.',
    fix: 'Check if you forgot to close parentheses, brackets, or indented code blocks.',
  },
  'IndentationError': {
    friendlyMessage: 'Your spacing is off.',
    explanation: 'Python uses spaces or tabs to group code together. If the spacing is inconsistent, Python gets confused about which code belongs together.',
    example: 'Code inside an if statement needs to be indented further than the if line.',
    fix: 'Make sure all code inside a block (after if, for, while, def) has the same number of spaces.',
  },
  'NameError: name': {
    friendlyMessage: 'You are using a name that the computer does not recognize.',
    explanation: 'A NameError means you tried to use a variable or function that has not been defined yet. It is like trying to open a box that does not exist.',
    example: 'If you write `print(age)` but never created `age = ...` first, you will get this error.',
    fix: 'Check the spelling of the name. Make sure you created (defined) the variable before using it.',
  },
  'TypeError': {
    friendlyMessage: 'You are trying to do something with the wrong type of data.',
    explanation: 'A TypeError happens when you mix incompatible data types. For example, trying to add a number to text, or calling something that isn\'t a function.',
    example: `print("Hello" + 5)  # Cannot add text and number together`,
    fix: 'Make sure you are using the right types. Convert numbers to strings with str() or strings to numbers with int().',
  },
  'ValueError': {
    friendlyMessage: 'You gave the computer a valid type but the wrong value.',
    explanation: 'A ValueError means the value you provided is not acceptable. For example, trying to convert "abc" into a number.',
    example: `int("hello")  # Cannot convert "hello" to a number`,
    fix: 'Check the value you are passing. Make sure it is appropriate for what you are trying to do.',
  },
  'IndexError': {
    friendlyMessage: 'You tried to access an item that does not exist in the list.',
    explanation: 'An IndexError means you asked for something at a position that is outside the list. Like asking for the 10th item in a list that only has 3 items.',
    example: `fruits = ["apple", "banana"]\nprint(fruits[5])  # Only 2 items, index 5 doesn't exist`,
    fix: 'Check the length of your list using len(). Remember that counting starts at 0, so the last item is at index len(list) - 1.',
  },
  'KeyError': {
    friendlyMessage: 'You tried to access a key that does not exist in the dictionary.',
    explanation: 'A KeyError means you asked for a key in a dictionary that has not been set yet.',
    fix: 'Check the spelling of the key. Make sure the key exists before accessing it, or use .get() to provide a default value.',
  },
  'ZeroDivisionError': {
    friendlyMessage: 'You tried to divide by zero — which is impossible!',
    explanation: 'In math, you cannot divide a number by zero. The computer does not know what to do, so it gives you this error.',
    example: `result = 10 / 0  # Cannot divide by zero!`,
    fix: 'Check the value of the number you are dividing by. Add a condition to make sure it is not zero before dividing.',
  },
  'AttributeError': {
    friendlyMessage: 'You are trying to use something that does not exist on this object.',
    explanation: 'An AttributeError means you tried to call a method or access a property that does not exist for that type of data.',
    example: `"hello".append("world")  # Strings don't have an append method`,
    fix: 'Check the spelling of the method/property. Make sure the data type supports what you are trying to do.',
  },
  // JavaScript errors
  'ReferenceError': {
    friendlyMessage: 'You are using a variable that has not been declared.',
    explanation: 'A ReferenceError means you tried to use a variable that does not exist yet.',
    fix: 'Declare the variable with let, const, or var before using it.',
  },
  'TypeError: Cannot read properties of undefined': {
    friendlyMessage: 'You are trying to access something on a value that does not exist (undefined).',
    explanation: 'This happens when you try to access a property of something that is undefined — like trying to open a door that does not exist.',
    fix: 'Make sure the variable has a value before accessing its properties.',
  },
  'RangeError': {
    friendlyMessage: 'A number is outside the allowed range.',
    explanation: 'A RangeError means a numeric value is outside the range of what is acceptable.',
    fix: 'Check the values you are using — make sure arrays are not too large and recursion has a base case.',
  },
};

interface ErrorTranslatorProps {
  errorMessage: string;
  language?: string;
}

export function ErrorTranslator({ errorMessage, language = 'python' }: ErrorTranslatorProps) {
  if (!errorMessage || errorMessage.trim() === '') return null;

  const translation = findTranslation(errorMessage, language);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-destructive">Error Detected</p>
          <p className="text-xs text-muted-foreground font-mono mt-1 line-clamp-2">{errorMessage}</p>
        </div>
      </div>

      {translation ? (
        <div className="space-y-3 pl-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">What this means</p>
            </div>
            <p className="text-sm">{translation.friendlyMessage}</p>
            <p className="text-xs text-muted-foreground mt-1">{translation.explanation}</p>
          </div>

          {translation.example && (
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Example</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-code">{translation.example}</pre>
            </div>
          )}

          {translation.fix && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileWarning className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-400">{translation.fix}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="pl-8">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground">Don't panic!</p>
          </div>
          <p className="text-sm">Errors are normal — every programmer gets them! The computer is trying to tell you something went wrong. Try these steps:</p>
          <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
            <li>Read the error message carefully — it tells you where the problem is</li>
            <li>Check for typos: missing quotes, colons, parentheses, or brackets</li>
            <li>Make sure all variables are defined before you use them</li>
            <li>Check your indentation / spacing</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function findTranslation(error: string, language: string): ErrorTranslation | null {
  const lower = error.toLowerCase();

  // Try exact matches first
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (lower.includes(key.toLowerCase())) {
      return translation;
    }
  }

  // Try partial matches
  if (lower.includes('syntaxerror')) {
    return errorTranslations['SyntaxError: invalid syntax'];
  }
  if (lower.includes('indentationerror') || lower.includes('unexpected indent')) {
    return errorTranslations['IndentationError'];
  }
  if (lower.includes('nameerror') || lower.includes('is not defined')) {
    return errorTranslations['NameError: name'];
  }
  if (lower.includes('typeerror')) {
    return errorTranslations['TypeError'];
  }
  if (lower.includes('valueerror')) {
    return errorTranslations['ValueError'];
  }
  if (lower.includes('indexerror') || lower.includes('list index out of range')) {
    return errorTranslations['IndexError'];
  }
  if (lower.includes('keyerror')) {
    return errorTranslations['KeyError'];
  }
  if (lower.includes('zerodivisionerror') || lower.includes('division by zero')) {
    return errorTranslations['ZeroDivisionError'];
  }
  if (lower.includes('attributeerror')) {
    return errorTranslations['AttributeError'];
  }
  if (lower.includes('referenceerror')) {
    return errorTranslations['ReferenceError'];
  }
  if (lower.includes('cannot read properties of undefined')) {
    return errorTranslations['TypeError: Cannot read properties of undefined'];
  }
  if (lower.includes('rangeerror')) {
    return errorTranslations['RangeError'];
  }

  return null;
}
