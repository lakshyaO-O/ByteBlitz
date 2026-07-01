export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VisualExample {
  title: string;
  code: string;
  output: string;
  explanation: string;
}

export interface SyntaxBlock {
  language: string;
  code: string;
  notes: string;
}

export interface CodingChallenge {
  title: string;
  instructions: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
  testCases: Array<{ input: string; expected: string }>;
  solution: string;
}

export interface LessonData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
  coinReward: number;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard';
  topics: string[];
  explanation: string;
  visualExamples: VisualExample[];
  realLifeAnalogy: string;
  syntax: SyntaxBlock[];
  quiz: QuizQuestion[];
  codingChallenge: CodingChallenge;
  commonMistakes: string[];
  proTips: string[];
  summary: string[];
  additionalResources: Array<{ title: string; url: string; platform: string }>;
}

export const lessons: LessonData[] = [
  {
    id: 1,
    title: 'Introduction to Programming',
    subtitle: 'What is code?',
    description: 'Learn what programming is and how computers understand instructions. No prior knowledge needed!',
    icon: 'BookOpen',
    color: 'from-blue-400 to-cyan-400',
    xpReward: 50,
    coinReward: 10,
    estimatedMinutes: 10,
    difficulty: 'beginner',
    topics: ['What is a program?', 'How computers think', 'Your first mindset', 'Why we code'],
    explanation: `Programming is the art of giving instructions to a computer. Just like you follow a recipe to bake a cake, a computer follows your code to perform tasks.

Computers are incredibly fast, but they are also incredibly dumb — they only do exactly what you tell them, nothing more. This is why we need to be precise and clear when we write code.

Every program you write is a set of step-by-step instructions. The computer reads these instructions one at a time and executes them in order. This is called "sequential execution."`,
    visualExamples: [
      {
        title: 'Your First Instruction',
        code: 'print("Hello, World!")',
        output: 'Hello, World!',
        explanation: 'This is the simplest program. It tells the computer to display "Hello, World!" on the screen. The print() command is like saying "show this on the screen."'
      },
      {
        title: 'Multiple Instructions',
        code: 'print("Step 1: Wake up")\nprint("Step 2: Brush teeth")\nprint("Step 3: Code!")',
        output: 'Step 1: Wake up\nStep 2: Brush teeth\nStep 3: Code!',
        explanation: 'The computer runs each instruction in order, from top to bottom. Just like following a recipe!'
      }
    ],
    realLifeAnalogy: 'Think of programming like giving cooking instructions to a robot chef. You need to be very specific and step-by-step! If you say "cook the pasta" but forget to say "boil water first," the robot might put dry pasta in a cold pot. Computers are the same — they need every detail.',
    syntax: [
      { language: 'Python', code: 'print("Hello!")\n# Comments start with #\n# Python uses simple English-like syntax', notes: 'Python is great for beginners because it reads like English.' },
      { language: 'JavaScript', code: 'console.log("Hello!");\n// Comments start with //\n// JavaScript powers the web', notes: 'JavaScript is the language of the web. You are already using it!' },
      { language: 'C++', code: '#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello!";\n  return 0;\n}', notes: 'C++ is more complex but very powerful. Used for games and systems.' }
    ],
    quiz: [
      { question: 'What is a computer program?', options: ['A physical machine', 'A set of step-by-step instructions', 'A type of hardware', 'An internet connection'], correctIndex: 1, explanation: 'A program is a sequence of instructions that tells a computer what to do.' },
      { question: 'How do computers execute instructions?', options: ['Randomly', 'In order, one at a time', 'All at once', 'Backwards'], correctIndex: 1, explanation: 'Computers execute instructions sequentially — one after another, in order.' },
      { question: 'What does print() do in Python?', options: ['Saves a file', 'Displays text on screen', 'Prints on paper', 'Creates a variable'], correctIndex: 1, explanation: 'print() outputs text to the screen so you can see the result.' },
    ],
    codingChallenge: {
      title: 'Your First Program',
      instructions: 'Write a program that displays your name on the screen. For example, if your name is Alex, the output should be: Alex',
      starterCode: '// Write your code below\n// Tip: use print() in Python or console.log() in JS\n\n',
      expectedOutput: 'Alex',
      hint: 'Try using console.log("Alex") for JavaScript or print("Alex") for Python.',
      testCases: [
        { input: '', expected: 'Alex' }
      ],
      solution: 'console.log("Alex");'
    },
    commonMistakes: [
      'Thinking computers are smart — they just follow instructions exactly. If your code does something unexpected, you probably told it to do that by mistake!',
      'Skipping steps — computers do nothing unless told. Every single step must be in your code.',
      'Giving up too early — every programmer gets errors. Debugging is a normal part of coding.'
    ],
    proTips: [
      'Type every example yourself — dont copy-paste. Your fingers learn along with your brain.',
      'Experiment! Change the text in print() and see what happens. Breaking things is how you learn.',
      'Use comments (lines starting with # or //) to explain your thinking. Future you will thank you.'
    ],
    summary: [
      'Programming is giving step-by-step instructions to a computer.',
      'Computers execute instructions in order, one at a time.',
      'print() / console.log() displays text on the screen.',
      'Be precise — computers take everything literally.',
      'Errors are normal and part of the learning process.'
    ],
    additionalResources: [
      { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', platform: 'Python.org' },
      { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', platform: 'MDN' },
      { title: 'W3Schools Python Intro', url: 'https://www.w3schools.com/python/', platform: 'W3Schools' }
    ]
  },
  {
    id: 2,
    title: 'Printing Output',
    subtitle: 'Make the computer talk',
    description: 'Write your very first line of code! Make the computer display messages on the screen.',
    icon: 'Zap',
    color: 'from-green-400 to-emerald-400',
    xpReward: 50,
    coinReward: 10,
    estimatedMinutes: 12,
    difficulty: 'beginner',
    topics: ['The print() command', 'Text vs numbers', 'Hello, World!', 'Multiple messages'],
    explanation: `Printing is how your program talks to you. When you use print(), you are asking the computer to display something on the screen.

Text must be wrapped in quotes (" ") so the computer knows it is text and not code. Numbers dont need quotes — the computer understands them directly.

You can print multiple things by separating them with commas, or by using multiple print() statements. Each print() automatically adds a new line at the end.`,
    visualExamples: [
      {
        title: 'Printing Text',
        code: 'print("Hello, World!")',
        output: 'Hello, World!',
        explanation: 'The text inside the quotes is displayed exactly as written. The quotes themselves are not shown.'
      },
      {
        title: 'Printing Numbers',
        code: 'print(42)\nprint(3.14)',
        output: '42\n3.14',
        explanation: 'Numbers dont need quotes. The computer understands them as numeric values.'
      },
      {
        title: 'Multiple Lines',
        code: 'print("Line 1")\nprint("Line 2")\nprint("Line 3")',
        output: 'Line 1\nLine 2\nLine 3',
        explanation: 'Each print() statement outputs on a new line. This is called a newline.'
      }
    ],
    realLifeAnalogy: 'Printing is like talking to the computer. You say something, and it repeats it back to you on the screen. Think of print() as the computers voice.',
    syntax: [
      { language: 'Python', code: 'print("Hello")\nprint(123)\nprint("A", "B", "C")', notes: 'Use commas to print multiple items with spaces between them.' },
      { language: 'JavaScript', code: 'console.log("Hello");\nconsole.log(123);\nconsole.log("A", "B", "C");', notes: 'console.log() is JavaScripts version of print().' },
      { language: 'C++', code: 'cout << "Hello";\ncout << 123;\ncout << "A" << " " << "B";', notes: 'Use << to send data to cout (console output).' }
    ],
    quiz: [
      { question: 'What is the correct way to display "Hello" in Python?', options: ['echo "Hello"', 'print("Hello")', 'display("Hello")', 'show("Hello")'], correctIndex: 1, explanation: 'print() is the correct Python function for displaying output.' },
      { question: 'Why do we put quotes around text?', options: ['To make it colorful', 'To tell the computer it is text, not code', 'Because the computer demands it', 'Its optional'], correctIndex: 1, explanation: 'Quotes distinguish text (strings) from code and numbers.' },
      { question: 'What does print(5 + 3) output?', options: ['5 + 3', '8', '"5 + 3"', '53'], correctIndex: 1, explanation: 'The computer calculates 5+3=8 first, then prints the result.' },
    ],
    codingChallenge: {
      title: 'Print Your Info',
      instructions: 'Write a program that prints three lines: your name, your age, and your favorite programming language so far.',
      starterCode: '// Print three lines:\n// 1. Your name\n// 2. Your age\n// 3. Your favorite language\n\n',
      expectedOutput: 'Alex\n25\nPython',
      hint: 'Use three separate console.log() or print() statements, one for each line.',
      testCases: [
        { input: '', expected: 'Alex\n25\nPython' }
      ],
      solution: 'console.log("Alex");\nconsole.log(25);\nconsole.log("Python");'
    },
    commonMistakes: [
      'Forgetting quotes around text — print(Hello) will give an error because Hello looks like a variable name.',
      'Forgetting parentheses — print is a function and needs () in Python.',
      'Using wrong quotes — mixing " and \' can cause errors. Stick to one style.'
    ],
    proTips: [
      'Use \\n inside a string to create a new line: print("Line1\\nLine2")',
      'You can print emojis too! print("🚀") works in modern languages.',
      'Use print() with no arguments to print a blank line for spacing.'
    ],
    summary: [
      'print() / console.log() displays output on the screen.',
      'Text must be wrapped in quotes (" ").',
      'Numbers do not need quotes.',
      'Each print() outputs on a new line.',
      'Commas separate multiple items with spaces.'
    ],
    additionalResources: [
      { title: 'Python print() Function', url: 'https://docs.python.org/3/library/functions.html#print', platform: 'Python.org' },
      { title: 'MDN console.log()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log', platform: 'MDN' },
      { title: 'C++ cout Guide', url: 'https://cplusplus.com/reference/iostream/cout/', platform: 'CPlusPlus.com' }
    ]
  },
  {
    id: 3,
    title: 'Variables',
    subtitle: 'Storage boxes for data',
    description: 'Learn how to store information in the computers memory using variables.',
    icon: 'Target',
    color: 'from-purple-400 to-pink-400',
    xpReward: 75,
    coinReward: 15,
    estimatedMinutes: 15,
    difficulty: 'beginner',
    topics: ['What is a variable?', 'Naming your boxes', 'Storing numbers', 'Storing text', 'Changing values'],
    explanation: `A variable is like a labeled box where you store information. You give the box a name (label), put something inside (value), and later you can look inside or change what is stored.

Variables are essential because they let your program remember things. Without variables your program would forget everything immediately.

To create a variable you choose a name and use the = sign to assign a value. The value can be text, numbers, or many other types of data. Once created you can use the variable name anywhere in your code and it will be replaced with its value.`,
    visualExamples: [
      {
        title: 'Creating Variables',
        code: 'name = "Alice"\nage = 25\nprint(name)\nprint(age)',
        output: 'Alice\n25',
        explanation: 'name stores the text "Alice" and age stores the number 25. When we print them, their values are shown.'
      },
      {
        title: 'Changing a Variable',
        code: 'score = 10\nprint(score)\nscore = 20\nprint(score)',
        output: '10\n20',
        explanation: 'Variables can change! First score is 10, then we update it to 20. The old value is replaced.'
      },
      {
        title: 'Using Variables in Math',
        code: 'a = 5\nb = 3\nsum = a + b\nprint(sum)',
        output: '8',
        explanation: 'You can use variables in calculations. The computer replaces a with 5 and b with 3, then adds them.'
      }
    ],
    realLifeAnalogy: 'Variables are like labeled boxes. You put something in a box, write a label on it, and later you can look inside or replace the contents. "Shoes box" might contain sneakers, and "Important papers box" might contain documents. The label (variable name) tells you what is inside (value).',
    syntax: [
      { language: 'Python', code: 'name = "Alice"\nage = 25\n# Variable names are case-sensitive\nName != name', notes: 'Python uses = for assignment. Variable names are case-sensitive.' },
      { language: 'JavaScript', code: 'let name = "Alice";\nlet age = 25;\n// Use let or const to declare\nconst PI = 3.14;', notes: 'Use let for values that change, const for values that stay the same.' },
      { language: 'C++', code: 'string name = "Alice";\nint age = 25;\n// You must specify the type\n// string, int, double, etc.', notes: 'C++ requires you to declare the type of each variable.' }
    ],
    quiz: [
      { question: 'What does the = sign do in programming?', options: ['Checks if two things are equal', 'Assigns a value to a variable', 'Creates a new file', 'Deletes a variable'], correctIndex: 1, explanation: '= assigns a value to a variable. To check equality use ==.' },
      { question: 'What is wrong with this variable name: my age?', options: ['Too short', 'Contains a space', 'Starts with lowercase', 'Nothing'], correctIndex: 1, explanation: 'Variable names cannot contain spaces. Use my_age or myAge instead.' },
      { question: 'What does this code output? x = 7; y = 2; print(x + y)', options: ['72', '9', '7 + 2', 'Error'], correctIndex: 1, explanation: 'x is 7, y is 2, so x + y = 9.' },
    ],
    codingChallenge: {
      title: 'Variable Calculator',
      instructions: 'Create two variables a and b with values 15 and 4. Then calculate and print: their sum, their product, and their difference (a minus b). Each on a new line.',
      starterCode: '// Create variables and calculate\n\n',
      expectedOutput: '19\n60\n11',
      hint: 'Use let a = 15; let b = 4; then console.log(a + b); console.log(a * b); etc.',
      testCases: [
        { input: '', expected: '19\n60\n11' }
      ],
      solution: 'let a = 15;\nlet b = 4;\nconsole.log(a + b);\nconsole.log(a * b);\nconsole.log(a - b);'
    },
    commonMistakes: [
      'Using spaces in variable names — use underscores (my_var) or camelCase (myVar).',
      'Forgetting to create a variable before using it — always declare before using.',
      'Confusing = (assignment) with == (comparison). = means "set to," == means "is equal to."'
    ],
    proTips: [
      'Use descriptive names like playerScore instead of ps. Your future self will thank you.',
      'In JavaScript prefer const by default. Only use let when you need to change the value.',
      'Initialize variables when you declare them — it avoids bugs.'
    ],
    summary: [
      'Variables store data in memory with a name and a value.',
      'Use = to assign a value to a variable.',
      'Variable names have no spaces and are case-sensitive.',
      'You can change a variable value anytime.',
      'Use variables in calculations and print statements.'
    ],
    additionalResources: [
      { title: 'Python Variables Guide', url: 'https://docs.python.org/3/tutorial/introduction.html#using-python-as-a-calculator', platform: 'Python.org' },
      { title: 'MDN JavaScript Variables', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations', platform: 'MDN' },
      { title: 'W3Schools Python Variables', url: 'https://www.w3schools.com/python/python_variables.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 4,
    title: 'Taking Input',
    subtitle: 'Talk back to the computer',
    description: 'Make your programs interactive! Let users type information that your program can use.',
    icon: 'Lightbulb',
    color: 'from-yellow-400 to-orange-400',
    xpReward: 75,
    coinReward: 15,
    estimatedMinutes: 15,
    difficulty: 'beginner',
    topics: ['The input() command', 'Storing user input', 'Asking questions', 'Using the answer'],
    explanation: `Input makes your programs interactive. Instead of just showing output you can ask the user questions and use their answers.

The input() function in Python (or prompt() / readline in other languages) pauses the program and waits for the user to type something and press Enter. Whatever they type is returned as text.

This is how all interactive programs work — from games asking your name to apps asking for your preferences. Input turns one-way communication into a conversation.`,
    visualExamples: [
      {
        title: 'Getting User Input',
        code: 'name = input("What is your name? ")\nprint("Hello, " + name)',
        output: 'What is your name? [user types: Alex]\nHello, Alex',
        explanation: 'The program asks a question, waits for the user to type, and then uses the answer in a greeting.'
      },
      {
        title: 'Input with Numbers',
        code: 'age = input("How old are you? ")\nnext_year = int(age) + 1\nprint("Next year you will be", next_year)',
        output: 'How old are you? [user types: 25]\nNext year you will be 26',
        explanation: 'Input comes back as text. Use int() to convert to a number for math operations.'
      }
    ],
    realLifeAnalogy: 'Input is like a conversation. You ask a question ("Whats your favorite color?"), your friend answers ("Blue"), and you respond based on their answer. The program asks, the user answers, and the program does something with that answer.',
    syntax: [
      { language: 'Python', code: 'name = input("Enter name: ")\n# input() always returns a string\nage = int(input("Age: "))', notes: 'Wrap input() with int() for numbers. Always returns a string by default.' },
      { language: 'JavaScript', code: 'let name = prompt("Enter name: ");\n// prompt() returns a string\nlet age = parseInt(prompt("Age: "));', notes: 'prompt() shows a dialog. Use parseInt() or Number() for numbers.' },
      { language: 'C++', code: 'string name;\ncout << "Enter name: ";\ncin >> name;\n// cin reads input into variable', notes: 'cin >> reads input. Use getline() for full lines with spaces.' }
    ],
    quiz: [
      { question: 'What type of data does input() return in Python?', options: ['Number', 'String (text)', 'Boolean', 'It depends on what the user types'], correctIndex: 1, explanation: 'input() always returns a string, even if the user types numbers.' },
      { question: 'How do you convert user input to a number in Python?', options: ['number()', 'int(input())', 'convert()', 'parseInt()'], correctIndex: 1, explanation: 'int() converts a string to an integer. Wrap it around input().' },
      { question: 'What happens when a program reaches input()?', options: ['It crashes', 'It waits for the user to type', 'It skips ahead', 'It prints the prompt and continues'], correctIndex: 1, explanation: 'The program pauses and waits for the user to type something and press Enter.' },
    ],
    codingChallenge: {
      title: 'Personalized Greeting',
      instructions: 'Ask the user for their name and favorite color. Then print a message saying: "[name] loves [color]!"',
      starterCode: '// Get name and favorite color from user\n// Print the message\n\n',
      expectedOutput: 'What is your name?\nWhat is your favorite color?\nAlex loves Blue!',
      hint: 'Use prompt() twice. Store results in variables. Then use console.log() with string concatenation.',
      testCases: [
        { input: '', expected: 'Alex loves Blue!' }
      ],
      solution: 'let name = prompt("What is your name?");\nlet color = prompt("What is your favorite color?");\nconsole.log(name + " loves " + color + "!");'
    },
    commonMistakes: [
      'Forgetting to save input in a variable — input() returns a value, but if you do not store it, it is lost.',
      'Thinking input is already a number — it is always text. Convert with int() or float().',
      'Input works differently in different environments — in a browser prompt() works, but in Node.js you need readline.'
    ],
    proTips: [
      'Always give the user a clear prompt so they know what to type.',
      'Trim whitespace from input with .strip() or .trim() to avoid bugs.',
      'Add error handling with try/except when converting input to numbers.'
    ],
    summary: [
      'input() / prompt() gets input from the user.',
      'Input always comes back as text (string).',
      'Use int() / Number() to convert to numbers.',
      'Always store input in a variable to use it later.',
      'Clear prompts help the user know what to type.'
    ],
    additionalResources: [
      { title: 'Python input() Function', url: 'https://docs.python.org/3/library/functions.html#input', platform: 'Python.org' },
      { title: 'MDN prompt() Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt', platform: 'MDN' },
      { title: 'C++ cin Guide', url: 'https://cplusplus.com/doc/tutorial/basic_io/', platform: 'CPlusPlus.com' }
    ]
  },
  {
    id: 5,
    title: 'Operators',
    subtitle: 'Math for computers',
    description: 'Learn how to do math in code — addition, subtraction, multiplication, and more!',
    icon: 'Zap',
    color: 'from-red-400 to-rose-400',
    xpReward: 75,
    coinReward: 15,
    estimatedMinutes: 15,
    difficulty: 'beginner',
    topics: ['Addition (+)', 'Subtraction (-)', 'Multiplication (*)', 'Division (/)', 'Comparison operators'],
    explanation: `Operators are symbols that tell the computer to perform specific mathematical or logical operations. You already know most of them from math class!

The basic arithmetic operators are: + (addition), - (subtraction), * (multiplication), / (division). There is also % (modulo) which gives you the remainder of division.

Comparison operators compare values and return true or false: == (equal to), != (not equal to), < (less than), > (greater than), <= (less than or equal), >= (greater than or equal).`,
    visualExamples: [
      {
        title: 'Basic Arithmetic',
        code: 'print(10 + 5)\nprint(10 - 5)\nprint(10 * 5)\nprint(10 / 3)',
        output: '15\n5\n50\n3.333...',
        explanation: 'Basic math works just like in school. Note that division always gives a decimal result.'
      },
      {
        title: 'Modulo (Remainder)',
        code: 'print(10 % 3)\nprint(7 % 2)\nprint(16 % 4)',
        output: '1\n1\n0',
        explanation: 'Modulo gives the remainder. 10/3 = 3 remainder 1. 7/2 = 3 remainder 1. 16/4 = 4 remainder 0.'
      },
      {
        title: 'Comparison Operators',
        code: 'print(5 > 3)\nprint(5 == 3)\nprint(5 != 3)\nprint(5 >= 5)',
        output: 'true\nfalse\ntrue\ntrue',
        explanation: 'Comparisons always return true or false. These are called boolean values.'
      }
    ],
    realLifeAnalogy: 'Operators are like the buttons on a calculator. You give it numbers and tell it what to do with them. "10 + 5" is like pressing 10, then +, then 5, then =. Comparison operators are like checking "Is 10 greater than 5?" — yes or no.',
    syntax: [
      { language: 'Python', code: 'sum = 10 + 5\ndiff = 10 - 5\nproduct = 10 * 5\nquotient = 10 / 3\nremainder = 10 % 3\npower = 2 ** 3', notes: 'Python uses ** for exponent (power). // for integer (floor) division.' },
      { language: 'JavaScript', code: 'let sum = 10 + 5;\nlet diff = 10 - 5;\nlet product = 10 * 5;\nlet quotient = 10 / 3;\nlet remainder = 10 % 3;\nlet power = 2 ** 3;', notes: 'JavaScript uses ** for exponent too. Math.pow() also works.' },
      { language: 'C++', code: 'int sum = 10 + 5;\nint product = 10 * 5;\nfloat quotient = 10.0 / 3.0;\nint remainder = 10 % 3;', notes: 'In C++, dividing two integers gives an integer. Use float for decimals.' }
    ],
    quiz: [
      { question: 'What does 17 % 5 equal?', options: ['3', '2', '3.4', '12'], correctIndex: 1, explanation: '17 divided by 5 is 3 with remainder 2. So 17 % 5 = 2.' },
      { question: 'What is the result of 5 == 5?', options: ['5', 'true', '"5 == 5"', 'false'], correctIndex: 1, explanation: '== compares two values. Since 5 equals 5, it returns true.' },
      { question: 'What does "string" + "concat" produce?', options: ['string + concat', 'stringconcat', 'Error', 'string concat'], correctIndex: 1, explanation: '+ can also join (concatenate) strings together: "string" + "concat" = "stringconcat".' },
    ],
    codingChallenge: {
      title: 'Temperature Converter',
      instructions: 'Convert 100 degrees Celsius to Fahrenheit using the formula: F = (C × 9/5) + 32. Store the result in a variable and print it.',
      starterCode: '// Convert Celsius to Fahrenheit\n\n',
      expectedOutput: '212',
      hint: 'let celsius = 100; let fahrenheit = (celsius * 9/5) + 32; Then print fahrenheit.',
      testCases: [
        { input: '', expected: '212' }
      ],
      solution: 'let celsius = 100;\nlet fahrenheit = (celsius * 9 / 5) + 32;\nconsole.log(fahrenheit);'
    },
    commonMistakes: [
      'Confusing = (assignment) with == (comparison). = sets a value, == checks equality.',
      'Forgetting that / in Python always gives a decimal. Use // for integer division.',
      'Mixing types — "5" + 3 gives "53" (string) in some languages, not 8.'
    ],
    proTips: [
      'Use parentheses to make operator order clear: (a + b) * c is better than a + b * c.',
      'The modulo operator % is great for checking even/odd: if n % 2 == 0 means even.',
      'In JavaScript use === instead of == for strict comparison (checks type too).'
    ],
    summary: [
      'Arithmetic operators: +, -, *, /, %, **',
      'Comparison operators: ==, !=, <, >, <=, >=',
      '= assigns, == compares (checks equality).',
      '% gives the remainder of division.',
      'Comparisons return true or false (boolean values).'
    ],
    additionalResources: [
      { title: 'Python Operators', url: 'https://docs.python.org/3/library/operator.html', platform: 'Python.org' },
      { title: 'MDN JavaScript Operators', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators', platform: 'MDN' },
      { title: 'W3Schools Python Operators', url: 'https://www.w3schools.com/python/python_operators.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 6,
    title: 'Conditions',
    subtitle: 'Make decisions',
    description: 'Teach your program to make decisions using if-else statements.',
    icon: 'Lightbulb',
    color: 'from-indigo-400 to-purple-400',
    xpReward: 100,
    coinReward: 20,
    estimatedMinutes: 18,
    difficulty: 'easy',
    topics: ['If statements', 'Else statements', 'Comparison', 'Multiple conditions', 'Logical operators'],
    explanation: `Conditions let your program make decisions. Instead of always running the same code, your program can check something and choose what to do.

The if statement checks a condition. If the condition is true, the code inside runs. If false, it skips to the else block (if there is one) or continues.

You can chain multiple conditions with else if (elif in Python) to handle many different cases. Logical operators like and, or, not let you combine conditions.`,
    visualExamples: [
      {
        title: 'If Statement',
        code: 'age = 18\nif age >= 18:\n    print("You can vote!")\nelse:\n    print("Too young!")',
        output: 'You can vote!',
        explanation: 'Since age is 18, the condition age >= 18 is true, so it prints the first message.'
      },
      {
        title: 'Multiple Conditions',
        code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("F")',
        output: 'B',
        explanation: 'The computer checks each condition in order. 85 is not >= 90, but it is >= 80, so it prints "B".'
      },
      {
        title: 'Logical Operators',
        code: 'age = 22\nhas_id = True\nif age >= 18 and has_id:\n    print("Entry allowed")',
        output: 'Entry allowed',
        explanation: 'Both conditions must be true for an "and" to pass. Age is >= 18 AND has_id is True, so entry is allowed.'
      }
    ],
    realLifeAnalogy: 'Conditions are like crossing a road. "If the light is green, walk. Else (if red), wait." Or like checking the weather: "If it is raining, take an umbrella. Else, leave it." Your program makes these same kinds of decisions.',
    syntax: [
      { language: 'Python', code: 'if age >= 18:\n    print("Adult")\nelif age >= 13:\n    print("Teen")\nelse:\n    print("Child")\n# Note the colon : and indentation', notes: 'Python uses colons and indentation (4 spaces) for if/else blocks.' },
      { language: 'JavaScript', code: 'if (age >= 18) {\n    console.log("Adult");\n} else if (age >= 13) {\n    console.log("Teen");\n} else {\n    console.log("Child");\n}', notes: 'JS uses parentheses around conditions and curly braces {} for blocks.' },
      { language: 'C++', code: 'if (age >= 18) {\n    cout << "Adult";\n} else if (age >= 13) {\n    cout << "Teen";\n} else {\n    cout << "Child";\n}', notes: 'Same syntax as JavaScript. Use {} and semicolons.' }
    ],
    quiz: [
      { question: 'What does an if statement do?', options: ['Repeats code', 'Makes a decision based on a condition', 'Defines a function', 'Creates a variable'], correctIndex: 1, explanation: 'if checks a condition and runs code only if it is true.' },
      { question: 'What is the result? x = 10; if x > 5: print("yes")', options: ['yes', 'Nothing', 'Error', 'x > 5'], correctIndex: 0, explanation: '10 is greater than 5, so the condition is true and "yes" is printed.' },
      { question: 'What does "and" do in a condition?', options: ['Both must be true for the overall condition to be true', 'Either must be true', 'Neither must be true', 'It combines strings'], correctIndex: 0, explanation: 'and requires ALL conditions to be true. or requires ANY to be true.' },
    ],
    codingChallenge: {
      title: 'Grade Checker',
      instructions: 'Write a program that checks a score variable and prints the grade: A for 90+, B for 80+, C for 70+, F for below 70. Use a score of 85.',
      starterCode: '// Check score and print grade\n\n',
      expectedOutput: 'B',
      hint: 'Use if-else if-else chain. Start with the highest condition first.',
      testCases: [
        { input: '', expected: 'B' }
      ],
      solution: 'let score = 85;\nif (score >= 90) {\n  console.log("A");\n} else if (score >= 80) {\n  console.log("B");\n} else if (score >= 70) {\n  console.log("C");\n} else {\n  console.log("F");\n}'
    },
    commonMistakes: [
      'Using = instead of == — = assigns, == compares. This is the most common bug in all of programming!',
      'Forgetting the colon (:) after if/else in Python.',
      'Putting a semicolon after the condition: if (x > 5); — the semicolon ends the if statement before the block!'
    ],
    proTips: [
      'Write conditions in the order they are most likely to be true for faster programs.',
      'Use && (and) carefully — many languages short-circuit: if the first condition is false, the second is not checked.',
      'Simplify nested ifs with logical operators. if (a) { if (b) { ... } } can be if (a && b) { ... }.'
    ],
    summary: [
      'if statements let your program make decisions.',
      'if runs code when the condition is true.',
      'else runs code when the condition is false.',
      'elif / else if chains multiple conditions.',
      'Use and (&&), or (||), not (!) for complex conditions.'
    ],
    additionalResources: [
      { title: 'Python if Statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements', platform: 'Python.org' },
      { title: 'MDN if...else Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else', platform: 'MDN' },
      { title: 'W3Schools Python Conditions', url: 'https://www.w3schools.com/python/python_conditions.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 7,
    title: 'Loops',
    subtitle: 'Repeat without repeating',
    description: 'Learn how to make the computer repeat tasks automatically. Loops save you from writing the same code again and again!',
    icon: 'Zap',
    color: 'from-teal-400 to-cyan-400',
    xpReward: 100,
    coinReward: 20,
    estimatedMinutes: 18,
    difficulty: 'easy',
    topics: ['Why loops?', 'For loops', 'While loops', 'Range', 'Looping through items'],
    explanation: `Loops are one of the most powerful concepts in programming. They let you repeat code without writing it over and over.

There are two main types: for loops (when you know how many times to repeat) and while loops (when you repeat until a condition changes).

For loops are perfect for counting, iterating through lists, or repeating a task a specific number of times. While loops are better when you want to keep going until something happens.`,
    visualExamples: [
      {
        title: 'For Loop — Count to 5',
        code: 'for i in range(1, 6):\n    print(i)',
        output: '1\n2\n3\n4\n5',
        explanation: 'The loop runs 5 times. i takes each value from 1 to 5, one at a time.'
      },
      {
        title: 'While Loop',
        code: 'count = 1\nwhile count <= 5:\n    print(count)\n    count = count + 1',
        output: '1\n2\n3\n4\n5',
        explanation: 'While count is <= 5, keep printing and adding 1. When count becomes 6, the loop stops.'
      },
      {
        title: 'Sum of Numbers',
        code: 'total = 0\nfor i in range(1, 101):\n    total = total + i\nprint(total)',
        output: '5050',
        explanation: 'This loop adds all numbers from 1 to 100. The computer does 100 additions in a fraction of a second!'
      }
    ],
    realLifeAnalogy: 'Loops are like telling someone "clap 10 times" instead of saying "clap, clap, clap..." 10 times. Much easier! Or think of a washing machine cycle — it repeats the same steps (fill, wash, rinse, spin) without you having to manually control each one.',
    syntax: [
      { language: 'Python', code: '# For loop\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1', notes: 'range(5) gives 0,1,2,3,4. range(1,6) gives 1,2,3,4,5.' },
      { language: 'JavaScript', code: '// For loop\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n\n// While loop\nlet count = 0;\nwhile (count < 5) {\n    console.log(count);\n    count++;\n}', notes: 'for (init; condition; increment) is the classic C-style for loop.' },
      { language: 'C++', code: '// For loop\nfor (int i = 0; i < 5; i++) {\n    cout << i;\n}\n\n// While loop\nint count = 0;\nwhile (count < 5) {\n    cout << count;\n    count++;\n}', notes: 'Same as JavaScript. i++ means add 1 to i.' }
    ],
    quiz: [
      { question: 'How many times does this loop run? for i in range(3):', options: ['2', '3', '4', 'It depends'], correctIndex: 1, explanation: 'range(3) gives values 0, 1, 2 — that is 3 iterations.' },
      { question: 'What is an infinite loop?', options: ['A loop that runs very fast', 'A loop that never stops', 'A loop with no code inside', 'A loop that runs once'], correctIndex: 1, explanation: 'An infinite loop runs forever because the exit condition is never met.' },
      { question: 'What does this print? for i in range(1, 4): print(i)', options: ['1 2 3', '0 1 2', '1 2 3 4', '0 1 2 3'], correctIndex: 0, explanation: 'range(1, 4) goes from 1 to 3 (4 is excluded).' },
    ],
    codingChallenge: {
      title: 'Sum from 1 to N',
      instructions: 'Use a loop to calculate the sum of all numbers from 1 to 100. Print the result.',
      starterCode: '// Calculate sum of 1 to 100 using a loop\n\n',
      expectedOutput: '5050',
      hint: 'Use a for loop. Initialize total = 0, then add each number in the loop.',
      testCases: [
        { input: '', expected: '5050' }
      ],
      solution: 'let total = 0;\nfor (let i = 1; i <= 100; i++) {\n  total += i;\n}\nconsole.log(total);'
    },
    commonMistakes: [
      'Infinite loops — forgetting to increment the counter in a while loop, or using a condition that never becomes false.',
      'Off-by-one errors — using range(5) when you want 1-5 (range gives 0-4). Or using <= when you need <. Check your boundaries!',
      'Modifying the list while looping through it — can cause skipped items or errors.'
    ],
    proTips: [
      'Use for loops when you know the number of iterations. Use while loops when you are waiting for a condition to change.',
      'i++ is shorthand for i = i + 1. Most languages support it.',
      'Break exits a loop early. Continue skips to the next iteration.'
    ],
    summary: [
      'Loops repeat code without writing it multiple times.',
      'For loops: repeat a known number of times.',
      'While loops: repeat until a condition becomes false.',
      'Range generates sequences of numbers for iteration.',
      'Avoid infinite loops — ensure your loop has a way to stop.'
    ],
    additionalResources: [
      { title: 'Python for Loops', url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements', platform: 'Python.org' },
      { title: 'MDN Loops Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration', platform: 'MDN' },
      { title: 'W3Schools Python Loops', url: 'https://www.w3schools.com/python/python_for_loops.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 8,
    title: 'Functions',
    subtitle: 'Your own commands',
    description: 'Create your own reusable commands. Functions are the building blocks of all great programs.',
    icon: 'Star',
    color: 'from-amber-400 to-yellow-400',
    xpReward: 100,
    coinReward: 25,
    estimatedMinutes: 18,
    difficulty: 'easy',
    topics: ['What is a function?', 'Defining a function', 'Calling a function', 'Parameters', 'Return values'],
    explanation: `A function is a reusable block of code that performs a specific task. You define it once and call it whenever you need it.

Functions are the most important organizing tool in programming. They let you break complex problems into smaller, manageable pieces.

Functions can take inputs (called parameters) and give back outputs (using return). A function without parameters just does its task. A function with parameters can be customized each time you call it.`,
    visualExamples: [
      {
        title: 'Simple Function',
        code: 'def greet():\n    print("Hello!")\n\ngreet()\ngreet()',
        output: 'Hello!\nHello!',
        explanation: 'We define greet() once and call it twice. Each call runs the print statement.'
      },
      {
        title: 'Function with Parameters',
        code: 'def greet(name):\n    print("Hello,", name)\n\ngreet("Alice")\ngreet("Bob")',
        output: 'Hello, Alice\nHello, Bob',
        explanation: 'The parameter name receives different values each time. This makes the function reusable for different inputs.'
      },
      {
        title: 'Function with Return',
        code: 'def add(a, b):\n    return a + b\n\nresult = add(5, 3)\nprint(result * 2)',
        output: '16',
        explanation: 'add() returns the sum. We store it in result and use it later. return sends a value back to where the function was called.'
      }
    ],
    realLifeAnalogy: 'Functions are like a recipe. Once you write it down (define the function), you can follow it anytime without remembering every step. A recipe for pancakes takes ingredients (parameters) and produces pancakes (return value). Different ingredients give different pancakes, but the steps are the same.',
    syntax: [
      { language: 'Python', code: 'def function_name(param1, param2):\n    """Docstring explains what it does"""\n    result = param1 + param2\n    return result', notes: 'Use def to define. Indent the body. Return sends back a value.' },
      { language: 'JavaScript', code: 'function functionName(param1, param2) {\n    // Function body\n    return param1 + param2;\n}\n\n// Arrow function\nconst add = (a, b) => a + b;', notes: 'Two ways: function keyword or arrow (=>) syntax. Arrow functions are modern.' },
      { language: 'C++', code: 'int add(int a, int b) {\n    return a + b;\n}\n\n// Must specify return type and parameter types', notes: 'C++ requires type declarations for everything.' }
    ],
    quiz: [
      { question: 'What does a return statement do?', options: ['Prints a value', 'Sends a value back to where the function was called', 'Ends the program', 'Creates a new variable'], correctIndex: 1, explanation: 'return sends a value back to the caller. Without return, a function returns undefined or None.' },
      { question: 'What are parameters?', options: ['Variables inside a function', 'Inputs that a function receives', 'The output of a function', 'Errors in a function'], correctIndex: 1, explanation: 'Parameters are the inputs a function accepts. They act as placeholders for actual values.' },
      { question: 'Why use functions?', options: ['To make code run faster', 'To reuse code and organize programs', 'To use more memory', 'To make code harder'], correctIndex: 1, explanation: 'Functions let you reuse code, organize logic, and break problems into smaller pieces.' },
    ],
    codingChallenge: {
      title: 'Double It',
      instructions: 'Write a function called doubleIt that takes a number and returns double its value. Then call it with 7 and print the result.',
      starterCode: '// Define doubleIt function\n// Call it with 7 and print\n\n',
      expectedOutput: '14',
      hint: 'function doubleIt(n) { return n * 2; } then console.log(doubleIt(7));',
      testCases: [
        { input: '', expected: '14' }
      ],
      solution: 'function doubleIt(n) {\n  return n * 2;\n}\nconsole.log(doubleIt(7));'
    },
    commonMistakes: [
      'Forgetting to call the function — greet without () just references the function, it does not run it.',
      'Mixing up parameters and arguments — parameters are the placeholders in the definition, arguments are the actual values passed.',
      'Forgetting the return keyword — the function will run but return nothing (undefined / None).'
    ],
    proTips: [
      'Give functions clear action names like calculateTotal, getUserName, or sendEmail.',
      'Keep functions small — each function should do ONE thing well.',
      'Use default parameter values for optional inputs: function greet(name = "Guest")'
    ],
    summary: [
      'Functions are reusable blocks of code.',
      'Defined once, called many times.',
      'Parameters are inputs to a function.',
      'return sends a value back to the caller.',
      'Functions make code organized, reusable, and testable.'
    ],
    additionalResources: [
      { title: 'Python Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', platform: 'Python.org' },
      { title: 'MDN Functions Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions', platform: 'MDN' },
      { title: 'W3Schools Python Functions', url: 'https://www.w3schools.com/python/python_functions.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 9,
    title: 'Arrays / Lists',
    subtitle: 'Shopping lists for code',
    description: 'Learn how to store multiple items in one place using lists (also called arrays).',
    icon: 'BookOpen',
    color: 'from-sky-400 to-blue-400',
    xpReward: 100,
    coinReward: 25,
    estimatedMinutes: 18,
    difficulty: 'easy',
    topics: ['What is a list?', 'Creating lists', 'Accessing items', 'Adding items', 'Removing items', 'List length'],
    explanation: `Lists (called arrays in some languages) let you store multiple items in a single variable. Instead of having 10 separate variables for 10 items, you have one list.

Items in a list are ordered and each item has an index number. The first item is at index 0 (not 1!), the second at index 1, and so on. This is called zero-based indexing and is used in almost all programming languages.

You can add items, remove items, loop through lists, and do many other operations. Lists are one of the most commonly used data structures.`,
    visualExamples: [
      {
        title: 'Creating a List',
        code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits)\nprint(fruits[0])\nprint(fruits[2])',
        output: '["apple", "banana", "cherry"]\napple\ncherry',
        explanation: 'fruits is a list with 3 items. fruits[0] gets the first item, fruits[2] gets the third.'
      },
      {
        title: 'Adding and Removing',
        code: 'numbers = [1, 2, 3]\nnumbers.append(4)\nprint(numbers)\nnumbers.remove(2)\nprint(numbers)',
        output: '[1, 2, 3, 4]\n[1, 3, 4]',
        explanation: 'append() adds to the end. remove() deletes a specific item. The list changes permanently.'
      },
      {
        title: 'Looping Through a List',
        code: 'colors = ["red", "green", "blue"]\nfor color in colors:\n    print(color.upper())',
        output: 'RED\nGREEN\nBLUE',
        explanation: 'A for loop can go through each item in a list automatically. Each iteration gives the next item.'
      }
    ],
    realLifeAnalogy: 'A list/array is exactly like a shopping list. It holds multiple items in order. You can add items (append milk), remove items (cross off bread), check what is at position 3, and see how many items are on the list.',
    syntax: [
      { language: 'Python', code: 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nfirst = fruits[0]  # apple\nlength = len(fruits)  # 3\nfruits.remove("banana")', notes: 'Python lists can hold different types. Use len() for length. Index starts at 0.' },
      { language: 'JavaScript', code: 'let fruits = ["apple", "banana"];\nfruits.push("cherry");\nlet first = fruits[0]; // apple\nlet length = fruits.length; // 3\nfruits.splice(1, 1); // remove banana', notes: 'push() adds, splice() removes. JS arrays are dynamic and flexible.' },
      { language: 'C++', code: 'vector<string> fruits = {"apple", "banana"};\nfruits.push_back("cherry");\nstring first = fruits[0];\nint len = fruits.size();', notes: 'C++ uses vector for dynamic arrays. Include <vector>. Fixed arrays use [] syntax.' }
    ],
    quiz: [
      { question: 'What index does the first item in a list have?', options: ['1', '0', '-1', 'It depends'], correctIndex: 1, explanation: 'Almost all programming languages use zero-based indexing. The first item is at index 0.' },
      { question: 'What does len([10, 20, 30, 40]) return?', options: ['3', '4', '10', '40'], correctIndex: 1, explanation: 'len() returns the number of items in the list — 4 items.' },
      { question: 'How do you access the last item in a list?', options: ['list[last]', 'list[-1] or list[length-1]', 'list[end]', 'list[0]'], correctIndex: 1, explanation: 'list[-1] gives the last item in Python. In other languages, use list[list.length - 1].' },
    ],
    codingChallenge: {
      title: 'List Sum',
      instructions: 'Create a list of numbers [10, 20, 30, 40, 50]. Use a loop to calculate the sum and print it.',
      starterCode: '// Sum all numbers in the list\n\n',
      expectedOutput: '150',
      hint: 'Create the array, loop through it with for, add each element to a total variable.',
      testCases: [
        { input: '', expected: '150' }
      ],
      solution: 'let numbers = [10, 20, 30, 40, 50];\nlet total = 0;\nfor (let i = 0; i < numbers.length; i++) {\n  total += numbers[i];\n}\nconsole.log(total);'
    },
    commonMistakes: [
      'Forgetting that counting starts at 0, not 1 — accessing index [length] gives an error.',
      'Trying to access an item that doesn\'t exist — index out of bounds causes errors.',
      'Confusing append/push with assignment — list[5] = value only works if the index exists.'
    ],
    proTips: [
      'Use list.length (or len(list)) to avoid index-out-of-bounds errors in loops.',
      'Negative indexing (list[-1]) in Python is a super convenient way to access items from the end.',
      'List comprehensions in Python (or map/filter in JS) are elegant alternatives to loops.'
    ],
    summary: [
      'Lists store multiple items in one variable.',
      'Items are ordered and indexed starting at 0.',
      'Add items with append() / push().',
      'Remove items with remove() / splice().',
      'Loop through lists to process each item.'
    ],
    additionalResources: [
      { title: 'Python Lists Tutorial', url: 'https://docs.python.org/3/tutorial/introduction.html#lists', platform: 'Python.org' },
      { title: 'MDN Arrays Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array', platform: 'MDN' },
      { title: 'W3Schools Python Lists', url: 'https://www.w3schools.com/python/python_lists.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 10,
    title: 'Strings',
    subtitle: 'Working with text',
    description: 'Master text manipulation — joining, splitting, searching, and modifying strings.',
    icon: 'Target',
    color: 'from-pink-400 to-rose-400',
    xpReward: 100,
    coinReward: 25,
    estimatedMinutes: 18,
    difficulty: 'easy',
    topics: ['What is a string?', 'String length', 'Joining strings', 'Splitting strings', 'Finding in strings', 'String methods'],
    explanation: `Strings are sequences of characters — text. Everything you put in quotes is a string. Strings are everywhere in programming: names, messages, file paths, and more.

You can combine strings (concatenation), split them apart, search for text inside them, change case, and much more. Every language has a rich set of string methods.

Strings are immutable in most languages — you cannot change a character in the middle. Instead, you create a new modified string.`,
    visualExamples: [
      {
        title: 'String Concatenation',
        code: 'first = "Hello"\nsecond = "World"\nmessage = first + " " + second\nprint(message)\nprint(len(message))',
        output: 'Hello World\n11',
        explanation: '+ joins strings. len() counts characters including spaces. "Hello World" has 11 characters.'
      },
      {
        title: 'String Methods',
        code: 'text = "  Python is AWESOME!  "\nprint(text.strip())\nprint(text.lower())\nprint(text.upper())\nprint(text.replace("AWESOME", "fun"))',
        output: 'Python is AWESOME!\n  python is awesome!  \n  PYTHON IS AWESOME!  \n  Python is fun!  ',
        explanation: 'Methods like strip(), lower(), and replace() create new modified strings without changing the original.'
      },
      {
        title: 'Finding in Strings',
        code: 'sentence = "The quick brown fox"\nprint("fox" in sentence)\nprint(sentence.index("quick"))\nprint(sentence[4:9])',
        output: 'True\n4\nquick',
        explanation: 'Use "in" to check if text exists. index() finds position. Slicing [start:end] extracts a portion.'
      }
    ],
    realLifeAnalogy: 'Strings are like sentences. You can count letters (length), combine sentences (concatenation), find words (search), cut them apart (slicing), change words (replace), or make them uppercase for emphasis.',
    syntax: [
      { language: 'Python', code: 'text = "Hello"\ntext.upper()  # "HELLO"\ntext.lower()  # "hello"\nlen(text)     # 5\n"He" in text  # True\ntext[1]       # "e"', notes: 'Strings are immutable. Methods return new strings. Use [] to access characters.' },
      { language: 'JavaScript', code: 'let text = "Hello";\ntext.toUpperCase(); // "HELLO"\ntext.toLowerCase(); // "hello"\ntext.length;        // 5\ntext.includes("He"); // true\ntext[1];            // "e"', notes: 'Similar methods in JS: toUpperCase(), toLowerCase(), includes(), charAt().' },
      { language: 'C++', code: 'string text = "Hello";\ntoupper(text[0]); // "H" -> "h"\ntext.length();    // 5\ntext.find("He");  // 0 (position)\ntext[1];          // "e"', notes: 'C++ strings are also sequences of characters. Use .find() for searching.' }
    ],
    quiz: [
      { question: 'What is "hello" + " " + "world"?', options: ['hello world', 'helloworld', 'hello + world', 'hello world '], correctIndex: 0, explanation: '+ concatenates strings. The " " adds a space between hello and world.' },
      { question: 'What does len("CodeAce") return?', options: ['6', '7', '8', '9'], correctIndex: 1, explanation: 'C-o-d-e-A-c-e has 7 characters. len() counts every character.' },
      { question: 'Are strings mutable (changeable) in Python?', options: ['Yes', 'No', 'Sometimes', 'Only in functions'], correctIndex: 1, explanation: 'Strings are immutable. You cannot change a character — you create a new string.' },
    ],
    codingChallenge: {
      title: 'Name Formatter',
      instructions: 'Take the string "john DOE", convert it to proper case (first letter of each word uppercase, rest lowercase), and print the result: "John Doe"',
      starterCode: '// Format the name to proper case\n\n',
      expectedOutput: 'John Doe',
      hint: 'Split the string by space, for each word: capitalize first letter, lowercase the rest, then join back with space.',
      testCases: [
        { input: '', expected: 'John Doe' }
      ],
      solution: 'let name = "john DOE";\nlet parts = name.split(" ");\nlet formatted = parts.map(p => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(" ");\nconsole.log(formatted);'
    },
    commonMistakes: [
      'Forgetting strings are case-sensitive — "Hello" !== "hello".',
      'Trying to change individual characters (strings are immutable) — create a new string instead.',
      'Using + inside a print to concatenate numbers and strings — convert numbers to string first.'
    ],
    proTips: [
      'Use f-strings (Python) or template literals (JavaScript) for cleaner string formatting.',
      'String methods can be chained: text.strip().lower().replace("x", "y").',
      'Escape special characters with \\: print("She said \\"Hello!\\"") for quotes inside strings.'
    ],
    summary: [
      'Strings are sequences of characters (text).',
      '+ concatenates (joins) strings.',
      'len() / .length gives the number of characters.',
      'Strings are immutable — methods return new strings.',
      'Use methods like lower(), upper(), replace(), find() to manipulate text.'
    ],
    additionalResources: [
      { title: 'Python Strings', url: 'https://docs.python.org/3/tutorial/introduction.html#strings', platform: 'Python.org' },
      { title: 'MDN String Methods', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String', platform: 'MDN' },
      { title: 'W3Schools Python Strings', url: 'https://www.w3schools.com/python/python_strings.asp', platform: 'W3Schools' }
    ]
  },
  {
    id: 11,
    title: '2D Arrays',
    subtitle: 'Tables and grids',
    description: 'Learn how to work with grids of data — like spreadsheets or game boards.',
    icon: 'Grid',
    color: 'from-violet-400 to-purple-400',
    xpReward: 125,
    coinReward: 30,
    estimatedMinutes: 20,
    difficulty: 'medium',
    topics: ['What is a 2D array?', 'Creating a grid', 'Accessing rows and columns', 'Looping through 2D arrays'],
    explanation: `A 2D array is an array of arrays — like a spreadsheet with rows and columns. Each row is an array, and the whole thing is an array of those rows.

You access items with two indices: array[row][column]. Row 0 is the first row, column 0 is the first column. Think of it like coordinates on a map.

2D arrays are perfect for representing grids: game boards (chess, tic-tac-toe), images (each pixel is a cell), spreadsheets, maps, and more.`,
    visualExamples: [
      {
        title: 'Creating a 2D Array',
        code: 'grid = [\n    [1, 2, 3],\n    [4, 5, 6],\n    [7, 8, 9]\n]\nprint(grid[0][0])\nprint(grid[1][2])\nprint(grid[2][1])',
        output: '1\n6\n8',
        explanation: 'grid[0][0] is row 0, col 0 = 1. grid[1][2] is row 1, col 2 = 6. grid[2][1] is row 2, col 1 = 8.'
      },
      {
        title: 'Looping Through a Grid',
        code: 'grid = [[1,2],[3,4]]\nfor row in grid:\n    for item in row:\n        print(item)',
        output: '1\n2\n3\n4',
        explanation: 'The outer loop goes through each row. The inner loop goes through each item in that row.'
      }
    ],
    realLifeAnalogy: 'A 2D array is like a spreadsheet with rows and columns, or a chessboard with squares. To reference a specific cell, you need the row number and the column number — just like in Battleship where you say "B7" (row B, column 7).',
    syntax: [
      { language: 'Python', code: 'grid = [[1, 2], [3, 4]]\nvalue = grid[0][1]  # 2\nrows = len(grid)\ncols = len(grid[0])\n# Loop:\nfor row in grid:\n    for item in row:\n        print(item)', notes: 'Nested lists. grid[row][col]. len(grid) gives row count.' },
      { language: 'JavaScript', code: 'let grid = [[1, 2], [3, 4]];\nlet value = grid[0][1]; // 2\nlet rows = grid.length;\nlet cols = grid[0].length;\n// Loop:\nfor (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n        console.log(grid[r][c]);\n    }\n}', notes: 'Nested for loops are the standard way to iterate 2D arrays.' },
      { language: 'C++', code: 'vector<vector<int>> grid = {{1,2}, {3,4}};\nint val = grid[0][1];\n// Requires nested loops like JS', notes: 'vector<vector<int>> for dynamic 2D arrays. Fixed: int grid[2][2].' }
    ],
    quiz: [
      { question: 'How do you access the item in row 2, column 0?', options: ['grid[2][0]', 'grid[0][2]', 'grid[2, 0]', 'grid(2)(0)'], correctIndex: 0, explanation: 'First index is row, second is column. grid[2][0] is row 2, column 0.' },
      { question: 'What type of data is a 2D array?', options: ['An array of numbers', 'An array of arrays', 'A single list', 'A function'], correctIndex: 1, explanation: 'A 2D array is an array where each element is itself an array (a row).' },
      { question: 'How many items are in a 3×4 2D array?', options: ['7', '12', '3', '4'], correctIndex: 1, explanation: '3 rows × 4 columns = 12 items total.' },
    ],
    codingChallenge: {
      title: 'Grid Sum',
      instructions: 'Create a 2×3 grid with values [[1,2,3],[4,5,6]]. Calculate and print the sum of all items.',
      starterCode: '// Sum all items in the 2D array\n\n',
      expectedOutput: '21',
      hint: 'Use nested loops. Outer loop for rows, inner loop for columns. Add each element to total.',
      testCases: [
        { input: '', expected: '21' }
      ],
      solution: 'let grid = [[1,2,3],[4,5,6]];\nlet total = 0;\nfor (let r = 0; r < grid.length; r++) {\n  for (let c = 0; c < grid[r].length; c++) {\n    total += grid[r][c];\n  }\n}\nconsole.log(total);'
    },
    commonMistakes: [
      'Confusing row and column order — always [row][col], not [col][row].',
      'Getting index out of bounds — remember rows start at 0, columns start at 0.',
      'Assuming all rows have the same length — jagged arrays (rows of different lengths) are possible but can cause bugs.'
    ],
    proTips: [
      'Draw a picture of your grid on paper before coding. It helps visualize rows and columns.',
      'Use i for outer loops (rows) and j for inner loops (columns) — this is a universal convention.',
      'For rectangular grids, store the dimensions at the start: rows = grid.length, cols = grid[0].length.'
    ],
    summary: [
      'A 2D array is an array of arrays (like a grid).',
      'Access items with two indices: grid[row][col].',
      'Use nested loops to iterate through all items.',
      'Useful for game boards, spreadsheets, images, and maps.',
      'Zero-based indexing applies to both rows and columns.'
    ],
    additionalResources: [
      { title: 'Python Nested Lists', url: 'https://docs.python.org/3/tutorial/datastructures.html#nested-list-comprehensions', platform: 'Python.org' },
      { title: 'MDN Multidimensional Arrays', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#multidimensional_arrays', platform: 'MDN' },
      { title: 'GeeksForGeeks 2D Arrays', url: 'https://www.geeksforgeeks.org/multidimensional-arrays-c-cpp/', platform: 'GeeksForGeeks' }
    ]
  },
  {
    id: 12,
    title: 'Searching',
    subtitle: 'Finding what you need',
    description: 'Learn how to search for items in lists efficiently.',
    icon: 'Search',
    color: 'from-emerald-400 to-green-400',
    xpReward: 125,
    coinReward: 30,
    estimatedMinutes: 20,
    difficulty: 'medium',
    topics: ['Linear search', 'Finding max/min', 'Checking if item exists', 'When to search'],
    explanation: `Searching is about finding information in a collection of data. The simplest way is linear search — checking each item one by one.

Linear search works on any list, sorted or unsorted. You start at the beginning and check each item until you find what you need (or reach the end).

For sorted lists, there are faster methods (like binary search), but linear search is the foundation and is perfectly fine for small lists.`,
    visualExamples: [
      {
        title: 'Linear Search',
        code: 'def find_item(lst, target):\n    for i in range(len(lst)):\n        if lst[i] == target:\n            return i\n    return -1\n\nitems = [5, 2, 8, 1, 9]\nprint(find_item(items, 8))\nprint(find_item(items, 3))',
        output: '2\n-1',
        explanation: 'The function checks each item. When it finds 8 at index 2, it returns 2. 3 is not in the list, so it returns -1.'
      },
      {
        title: 'Find Maximum',
        code: 'numbers = [3, 7, 2, 9, 1]\nmax_num = numbers[0]\nfor num in numbers:\n    if num > max_num:\n        max_num = num\nprint(max_num)',
        output: '9',
        explanation: 'Start with the first number as max. Compare each other number — if it is bigger, update max.'
      }
    ],
    realLifeAnalogy: 'Linear search is like looking for a specific book on a shelf. You start at one end and check each book until you find the one you want. If you reach the end without finding it, it is not there. Finding the maximum is like looking for the tallest person in a line — you compare each person with the tallest you have seen so far.',
    syntax: [
      { language: 'Python', code: '# Linear search\ndef search(arr, target):\n    for i, val in enumerate(arr):\n        if val == target:\n            return i\n    return -1\n\n# Built-in\nprint(target in arr)  # True/False\nprint(arr.index(target))  # position or error', notes: 'Python has in and index() built-in. enumerate() gives both index and value.' },
      { language: 'JavaScript', code: '// Linear search\nfunction search(arr, target) {\n    for (let i = 0; i < arr.length; i++) {\n        if (arr[i] === target) return i;\n    }\n    return -1;\n}\n\n// Built-in\narr.includes(target); // true/false\narr.indexOf(target);  // position or -1', notes: 'includes() and indexOf() are built-in array methods.' },
      { language: 'C++', code: '// Linear search\nint search(vector<int> arr, int target) {\n    for (int i = 0; i < arr.size(); i++) {\n        if (arr[i] == target) return i;\n    }\n    return -1;\n}\n\n// Built-in\nfind(arr.begin(), arr.end(), target);', notes: 'Use #include <algorithm> for find(). Returns iterator.' }
    ],
    quiz: [
      { question: 'What does linear search do?', options: ['Jumps to the middle first', 'Checks each item one by one', 'Sorts the list first', 'Uses a formula to find items'], correctIndex: 1, explanation: 'Linear search checks every item in order until found or the end is reached.' },
      { question: 'What does linear search return if the item is not found?', options: ['0', 'The list length', '-1 or false', 'It crashes'], correctIndex: 2, explanation: 'Returns -1 (or false/None in other languages) to indicate "not found."' },
      { question: 'How many checks does linear search need in the worst case for a list of n items?', options: ['1', 'n/2', 'n', 'n²'], correctIndex: 2, explanation: 'In the worst case (item not found or at the end), it checks all n items.' },
    ],
    codingChallenge: {
      title: 'Find the Index',
      instructions: 'Write a function that searches for the number 42 in the list [15, 42, 7, 99, 3] and prints its index. If not found, print -1.',
      starterCode: '// Search for 42 and print its index\n\n',
      expectedOutput: '1',
      hint: 'Loop through the array. If arr[i] === 42, print i and return. After the loop, print -1.',
      testCases: [
        { input: '', expected: '1' }
      ],
      solution: 'let arr = [15, 42, 7, 99, 3];\nlet found = -1;\nfor (let i = 0; i < arr.length; i++) {\n  if (arr[i] === 42) {\n    found = i;\n    break;\n  }\n}\nconsole.log(found);'
    },
    commonMistakes: [
      'Returning the value instead of the index — "I found 8!" vs "I found 8 at position 2!" Make sure you know which one you need.',
      'Forgetting to handle the "not found" case — always return -1 or similar sentinel value.',
      'Starting from index 1 instead of 0 when searching from the beginning.'
    ],
    proTips: [
      'Break out of the loop as soon as you find the item — no need to keep searching.',
      'For sorted arrays, binary search is much faster (log n vs n).',
      'Modern languages have built-in search — learn them, but understand how they work under the hood.'
    ],
    summary: [
      'Linear search checks each item one by one.',
      'Returns the index (position) or -1 if not found.',
      'Works on any list — sorted or unsorted.',
      'Worst case: checks all n items.',
      'Break early when the item is found.'
    ],
    additionalResources: [
      { title: 'Python Searching', url: 'https://docs.python.org/3/tutorial/datastructures.html#more-on-lists', platform: 'Python.org' },
      { title: 'MDN Array Search', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf', platform: 'MDN' },
      { title: 'Khan Academy - Linear Search', url: 'https://www.khanacademy.org/computing/computer-science/algorithms#linear-search', platform: 'Khan Academy' }
    ]
  },
  {
    id: 13,
    title: 'Sorting',
    subtitle: 'Putting things in order',
    description: 'Learn how to arrange data in order — smallest to largest, A to Z, and more.',
    icon: 'Zap',
    color: 'from-orange-400 to-red-400',
    xpReward: 125,
    coinReward: 30,
    estimatedMinutes: 22,
    difficulty: 'medium',
    topics: ['Why sort?', 'Bubble sort (simple)', 'Selection sort', 'Built-in sort', 'Ascending vs descending'],
    explanation: `Sorting arranges data in a specific order. It is one of the most fundamental operations in computer science.

Bubble sort is the simplest sorting algorithm. It repeatedly steps through the list, compares adjacent items, and swaps them if they are in the wrong order. It gets its name because larger items "bubble up" to the end.

Selection sort is slightly more efficient. It finds the smallest item and moves it to the front, then finds the next smallest and moves it to position 1, and so on.

In practice you will almost always use built-in sort functions, but understanding how sorting works is essential for interviews and for choosing the right approach.`,
    visualExamples: [
      {
        title: 'Bubble Sort Step by Step',
        code: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nprint(bubble_sort([64, 34, 25, 12, 22, 11, 90]))',
        output: '[11, 12, 22, 25, 34, 64, 90]',
        explanation: 'Bubble sort repeatedly swaps adjacent items that are out of order. Each pass "bubbles" the largest remaining item to its correct position.'
      },
      {
        title: 'Built-in Sort',
        code: 'numbers = [3, 1, 4, 1, 5, 9, 2, 6]\nnumbers.sort()\nprint(numbers)\nprint(sorted([3, 1, 4, 1, 5]))',
        output: '[1, 1, 2, 3, 4, 5, 6, 9]\n[1, 1, 3, 4, 5]',
        explanation: 'sort() modifies the list in-place. sorted() returns a new sorted list. Both are efficient and simple to use.'
      }
    ],
    realLifeAnalogy: 'Sorting is like organizing a deck of cards or arranging books alphabetically on a shelf. Bubble sort is like repeatedly going through the deck, comparing two cards at a time, and swapping them if the second one should come before the first. Selection sort is like finding the smallest card and putting it first, then finding the next smallest and putting it second, and so on.',
    syntax: [
      { language: 'Python', code: 'arr = [3, 1, 4, 1, 5]\narr.sort()  # in-place\nsorted_arr = sorted(arr)  # new list\n# Descending:\narr.sort(reverse=True)', notes: 'sort() modifies the list. sorted() returns a new list. Use reverse=True for descending.' },
      { language: 'JavaScript', code: 'let arr = [3, 1, 4, 1, 5];\narr.sort((a, b) => a - b);  // ascending\narr.sort((a, b) => b - a);  // descending\n// Strings sort alphabetically by default', notes: 'Pass a compare function for numbers. Without it, sorts alphabetically (1, 10, 2, 20...).' },
      { language: 'C++', code: 'vector<int> arr = {3, 1, 4, 1, 5};\nsort(arr.begin(), arr.end());  // ascending\nsort(arr.rbegin(), arr.rend()); // descending', notes: '#include <algorithm>. sort() takes begin/end iterators.' }
    ],
    quiz: [
      { question: 'Why is sorting useful?', options: ['It makes data look nicer', 'It enables faster searching and organized display', 'It uses more memory', 'It is required for all programs'], correctIndex: 1, explanation: 'Sorted data enables efficient algorithms like binary search and makes output organized.' },
      { question: 'What does bubble sort do in each pass?', options: ['Finds the smallest item', 'Bubbles the largest remaining item to its correct position', 'Reverses the list', 'Removes duplicates'], correctIndex: 1, explanation: 'Each pass compares adjacent items and swaps if needed, moving the largest unsorted item to the end.' },
      { question: 'What does arr.sort() do in Python?', options: ['Returns a new sorted list', 'Sorts the list in-place', 'Reverses the list', 'Removes duplicates'], correctIndex: 1, explanation: 'arr.sort() sorts the list in-place (modifies the original). sorted() returns a new list.' },
    ],
    codingChallenge: {
      title: 'Simple Bubble Sort',
      instructions: 'Implement a bubble sort to sort the array [5, 2, 9, 1, 5, 6] and print the sorted result.',
      starterCode: '// Implement bubble sort\n\n',
      expectedOutput: '[1, 2, 5, 5, 6, 9]',
      hint: 'Use nested for loops. Outer loop runs n times. Inner loop compares adjacent items and swaps if out of order.',
      testCases: [
        { input: '', expected: '1,2,5,5,6,9' }
      ],
      solution: 'let arr = [5, 2, 9, 1, 5, 6];\nfor (let i = 0; i < arr.length; i++) {\n  for (let j = 0; j < arr.length - i - 1; j++) {\n    if (arr[j] > arr[j + 1]) {\n      let temp = arr[j];\n      arr[j] = arr[j + 1];\n      arr[j + 1] = temp;\n    }\n  }\n}\nconsole.log(arr);'
    },
    commonMistakes: [
      'Forgetting that sort() sorts alphabetically by default (JavaScript) — always provide a compare function for numbers.',
      'Confusing sort() (in-place) with sorted() (returns new list) in Python.',
      'Off-by-one in bubble sort inner loop — should go up to n-i-1, not n-1.'
    ],
    proTips: [
      'For simple cases, use built-in sort — it is highly optimized and usually the fastest option.',
      'Stable sort preserves the original order of equal elements. Python and JS sorts are stable.',
      'For large datasets, merge sort or quick sort are much faster than bubble sort (n log n vs n²).'
    ],
    summary: [
      'Sorting arranges data in ascending or descending order.',
      'Bubble sort: simple but slow — O(n²).',
      'Selection sort: finds min and moves to front.',
      'Use built-in sort() or sorted() in practice.',
      'Sorted data enables faster searching (binary search).'
    ],
    additionalResources: [
      { title: 'Python Sorting Guide', url: 'https://docs.python.org/3/howto/sorting.html', platform: 'Python.org' },
      { title: 'MDN Array Sort', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort', platform: 'MDN' },
      { title: 'Khan Academy - Sorting Algorithms', url: 'https://www.khanacademy.org/computing/computer-science/algorithms#sorting-algorithms', platform: 'Khan Academy' }
    ]
  },
  {
    id: 14,
    title: 'Recursion',
    subtitle: 'Functions that call themselves',
    description: 'Learn the mind-bending concept of recursive functions — functions that call themselves!',
    icon: 'Repeat',
    color: 'from-cyan-400 to-teal-400',
    xpReward: 150,
    coinReward: 35,
    estimatedMinutes: 22,
    difficulty: 'medium',
    topics: ['What is recursion?', 'Base case', 'Recursive case', 'Simple examples', 'When to use recursion'],
    explanation: `Recursion is when a function calls itself. It is an alternative to loops for solving problems that can be broken down into smaller, similar sub-problems.

Every recursive function needs two things:
1. Base case — when to stop (otherwise it runs forever).
2. Recursive case — calling itself with a smaller or simpler input.

Recursion is especially useful for problems with a naturally recursive structure: tree traversal, directory browsing, mathematical sequences (factorial, Fibonacci), and divide-and-conquer algorithms.`,
    visualExamples: [
      {
        title: 'Countdown with Recursion',
        code: 'def countdown(n):\n    if n <= 0:\n        print("Go!")\n    else:\n        print(n)\n        countdown(n - 1)\n\ncountdown(3)',
        output: '3\n2\n1\nGo!',
        explanation: 'Base case: n <= 0 → print "Go!" and stop. Otherwise, print n and call countdown(n-1). Each call reduces n by 1 until we reach 0.'
      },
      {
        title: 'Factorial',
        code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    else:\n        return n * factorial(n - 1)\n\nprint(factorial(5))',
        output: '120',
        explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120. The function calls itself with n-1 until it reaches 1, then multiplies back up.'
      }
    ],
    realLifeAnalogy: 'Recursion is like looking in a mirror that shows another mirror — you see an infinite reflection. Each reflection is like a function calling itself. Or think of Russian nesting dolls (Matryoshka) — each doll contains a smaller version of itself until you reach the smallest one (the base case).',
    syntax: [
      { language: 'Python', code: 'def factorial(n):\n    if n <= 1:  # Base case\n        return 1\n    else:       # Recursive case\n        return n * factorial(n - 1)', notes: 'Always check the base case first! Otherwise you get infinite recursion.' },
      { language: 'JavaScript', code: 'function factorial(n) {\n    if (n <= 1) return 1;  // Base case\n    return n * factorial(n - 1);  // Recursive case\n}\n\n// Arrow function\nconst fact = n => n <= 1 ? 1 : n * fact(n - 1);', notes: 'Can use a ternary for simple recursion. Always include a base case.' },
      { language: 'C++', code: 'int factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}', notes: 'Same pattern. Be careful of stack overflow for very deep recursion.' }
    ],
    quiz: [
      { question: 'What is a base case in recursion?', options: ['The first call to the function', 'The condition that stops the recursion', 'The fastest part of the function', 'The last line of the function'], correctIndex: 1, explanation: 'The base case stops the recursion. Without it, the function would call itself forever.' },
      { question: 'What happens if you forget the base case?', options: ['The function runs once', 'Infinite recursion — stack overflow error', 'The function returns undefined', 'Nothing special'], correctIndex: 1, explanation: 'Without a base case, the function keeps calling itself until the call stack overflows.' },
      { question: 'What does factorial(0) return with the above code?', options: ['0', '1', 'undefined', 'Error'], correctIndex: 1, explanation: 'n <= 1 includes 0, so it returns 1. 0! is defined as 1 in mathematics.' },
    ],
    codingChallenge: {
      title: 'Fibonacci Recursion',
      instructions: 'Write a recursive function to calculate the nth Fibonacci number. The Fibonacci sequence starts 0, 1, 1, 2, 3, 5, 8... where each number is the sum of the previous two. Calculate and print the 7th Fibonacci number (0-indexed: fib(7) = 13).',
      starterCode: '// Recursive Fibonacci function\n\n',
      expectedOutput: '13',
      hint: 'Base cases: fib(0)=0, fib(1)=1. Recursive: fib(n)=fib(n-1)+fib(n-2). Print fib(7).',
      testCases: [
        { input: '', expected: '13' }
      ],
      solution: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}\nconsole.log(fib(7));'
    },
    commonMistakes: [
      'Forgetting the base case — causes infinite recursion and stack overflow.',
      'Not understanding the call stack — each recursive call waits for the calls below it to return.',
      'Using recursion when iteration would be simpler — recursion is not always the best tool.'
    ],
    proTips: [
      'Trace through recursive calls on paper. Write the call stack to understand the flow.',
      'Memoization (caching results) can dramatically speed up recursive functions.',
      'Some problems are naturally recursive (trees, JSON parsing). Others are better with loops.'
    ],
    summary: [
      'Recursion is when a function calls itself.',
      'Every recursive function needs a base case.',
      'The recursive case breaks the problem into a smaller version of itself.',
      'The call stack tracks all pending recursive calls.',
      'Use recursion for naturally recursive problems (trees, divide-and-conquer).'
    ],
    additionalResources: [
      { title: 'Python Recursion', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', platform: 'Python.org' },
      { title: 'MDN Recursion Guide', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion', platform: 'MDN' },
      { title: 'GeeksForGeeks Recursion', url: 'https://www.geeksforgeeks.org/recursion/', platform: 'GeeksForGeeks' }
    ]
  },
  {
    id: 15,
    title: 'Basic DSA',
    subtitle: 'Data Structures & Algorithms intro',
    description: 'A gentle introduction to data structures and algorithms — the foundation of all efficient code.',
    icon: 'Zap',
    color: 'from-primary to-secondary',
    xpReward: 200,
    coinReward: 50,
    estimatedMinutes: 25,
    difficulty: 'hard',
    topics: ['What are data structures?', 'What are algorithms?', 'Why efficiency matters', 'Stacks', 'Queues', 'Big O (simple)'],
    explanation: `Data structures are ways of organizing data so it can be used efficiently. Different structures are good for different tasks — like choosing the right container for storing things.

Algorithms are step-by-step procedures for solving problems. The best algorithm for a task depends on your data structure and what you need to do.

Big O notation describes how fast an algorithm runs as the input grows. O(1) is instant, O(n) is proportional to input size, O(n²) gets slow quickly. Understanding Big O helps you write efficient code.

Stacks and queues are simple but powerful data structures. A stack is like a pile of plates (last in, first out). A queue is like a line of people (first in, first out).`,
    visualExamples: [
      {
        title: 'Stack (LIFO)',
        code: '# Stack: Last In, First Out\nstack = []\nstack.append("A")  # push\nstack.append("B")\nstack.append("C")\nprint(stack.pop())  # C\nprint(stack.pop())  # B\nprint(stack.pop())  # A',
        output: 'C\nB\nA',
        explanation: 'The last item pushed (C) is the first one popped. Like a stack of plates — you take from the top.'
      },
      {
        title: 'Queue (FIFO)',
        code: '# Queue: First In, First Out\nfrom collections import deque\nqueue = deque()\nqueue.append("A")\nqueue.append("B")\nqueue.append("C")\nprint(queue.popleft())  # A\nprint(queue.popleft())  # B\nprint(queue.popleft())  # C',
        output: 'A\nB\nC',
        explanation: 'The first item added (A) is the first one removed. Like a line of people — first come, first served.'
      }
    ],
    realLifeAnalogy: 'Data structures are like different containers — boxes, shelves, cabinets — each good for different things. A stack is like a stack of plates (you take from the top). A queue is like a line at a coffee shop (first come, first served). Big O is like measuring "How long would it take to find a specific book?" — in a small shelf it is fast (O(n)), but in a library it takes much longer.',
    syntax: [
      { language: 'Python', code: '# Stack using list\nstack = []\nstack.append(item)  # push\nitem = stack.pop()  # pop\n\n# Queue using deque\nfrom collections import deque\nq = deque()\nq.append(item)\nitem = q.popleft()', notes: 'Python lists make good stacks. Use collections.deque for queues.' },
      { language: 'JavaScript', code: '// Stack using array\nlet stack = [];\nstack.push(item);  // push\nlet item = stack.pop();  // pop\n\n// Queue using array\nlet q = [];\nq.push(item);  // enqueue\nlet item = q.shift();  // dequeue', notes: 'Arrays work for both. shift() is O(n) though. For performance, use a custom queue.' },
      { language: 'C++', code: '#include <stack>\n#include <queue>\nstack<int> s;\ns.push(item);\ns.pop();\n\nqueue<int> q;\nq.push(item);\nq.pop();', notes: 'C++ has built-in stack and queue classes in the STL.' }
    ],
    quiz: [
      { question: 'What does LIFO stand for?', options: ['Last In, First Out', 'Least In, First Out', 'Last In, Fast Out', 'Large In, Fine Out'], correctIndex: 0, explanation: 'LIFO = Last In, First Out — the last item added is the first to be removed (like a stack).' },
      { question: 'What is Big O notation used for?', options: ['Counting lines of code', 'Describing algorithm efficiency as input grows', 'Measuring memory used', 'Calculating exact runtime'], correctIndex: 1, explanation: 'Big O describes how an algorithms performance scales with input size.' },
      { question: 'Which is faster: O(1) or O(n)?', options: ['O(1)', 'O(n)', 'They are the same', 'Depends on n'], correctIndex: 0, explanation: 'O(1) is constant time (always the same speed regardless of input size). O(n) grows with the input.' },
    ],
    codingChallenge: {
      title: 'Stack Reverse',
      instructions: 'Use a stack to reverse the string "hello". Push each character onto a stack, then pop them off to build the reversed string. Print the result.',
      starterCode: '// Reverse "hello" using a stack\n\n',
      expectedOutput: 'olleh',
      hint: 'Push each character of "hello" onto an array (stack), then pop them off one by one into a new string.',
      testCases: [
        { input: '', expected: 'olleh' }
      ],
      solution: 'let str = "hello";\nlet stack = [];\nfor (let c of str) stack.push(c);\nlet reversed = "";\nwhile (stack.length > 0) reversed += stack.pop();\nconsole.log(reversed);'
    },
    commonMistakes: [
      'Confusing stacks (LIFO) with queues (FIFO) — think plates vs line at a store.',
      'Thinking Big O gives exact runtime — it only describes how it scales. An O(n²) algorithm could be faster than O(n) for small inputs.',
      'Using the wrong data structure — choosing array search when you need a hash map (O(n) vs O(1)).'
    ],
    proTips: [
      'Choose data structures based on what operations you need: fast search? hash map. Ordered? array. FIFO? queue.',
      'Understanding Big O helps you make better design decisions. O(n log n) is usually fast enough.',
      'Start simple, optimize later. Premature optimization causes more problems than it solves.'
    ],
    summary: [
      'Data structures organize data for efficient use.',
      'Algorithms are step-by-step problem-solving procedures.',
      'Big O describes performance scaling (O(1), O(n), O(n²)).',
      'Stacks: LIFO (Last In, First Out).',
      'Queues: FIFO (First In, First Out).',
      'Choose the right tool for the job.'
    ],
    additionalResources: [
      { title: 'Python Data Structures', url: 'https://docs.python.org/3/tutorial/datastructures.html', platform: 'Python.org' },
      { title: 'MDN Data Structures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures', platform: 'MDN' },
      { title: 'GeeksForGeeks DSA Guide', url: 'https://www.geeksforgeeks.org/data-structures/', platform: 'GeeksForGeeks' }
    ]
  },
  {
    id: 16,
    title: 'Arena Unlocked!',
    subtitle: 'You are ready!',
    description: 'Congratulations! You have completed the beginner roadmap. The Arena is now open — test your skills against others!',
    icon: 'Trophy',
    color: 'from-yellow-400 to-amber-600',
    xpReward: 500,
    coinReward: 100,
    estimatedMinutes: 10,
    difficulty: 'medium',
    topics: ['Arena access granted', 'Matchmaking', '1v1 battles', 'ELO ranking', 'Compete globally'],
    explanation: `You have made it! You have completed the entire beginner programming roadmap. That is a huge achievement.

Now it is time to put your skills to the test in the Arena. The Arena is DevRann's competitive coding platform where you face off against other programmers in real-time 1v1 battles.

You will be matched with opponents of similar skill level using our ELO ranking system. Each battle presents a coding challenge, and the first to solve it wins. Winning matches earns you rating points and moves you up the leaderboard.

Remember: every expert was once a beginner. The Arena is where you grow from a learner into a competitive coder.`,
    visualExamples: [
      {
        title: 'What to Expect in the Arena',
        code: `// Arena Match Flow:\n// 1. Enter matchmaking queue\n// 2. Get matched with an opponent\n// 3. Both receive the same problem\n// 4. First correct submission wins\n// 5. ELO ratings are updated`,
        output: '→ Match Found!\n→ Problem: "Two Sum"\n→ You submitted in 3:42\n→ Correct! +25 ELO 🎉',
        explanation: 'The Arena matches you with someone of similar skill. You both solve the same problem. Speed and correctness matter.'
      }
    ],
    realLifeAnalogy: 'The Arena is like a sports tournament. You have trained hard, learned the fundamentals, and now it is game time. Every match is a chance to improve, learn from others, and prove your skills. Win or lose, you get better with every battle.',
    syntax: [
      { language: 'Python', code: '# Arena-ready Python skills:\n# Variables, input, if/else, loops,\n# functions, lists, strings, 2D arrays\n# searching, sorting, recursion\nprint("Ready for the Arena!")', notes: 'You now know enough Python to compete in the Arena. Start with easy problems and work up.' },
      { language: 'JavaScript', code: '// Arena-ready JS skills:\n// All fundamentals covered\nconsole.log("Ready for the Arena!");', notes: 'JavaScript is great for the Arena. Focus on array methods and string manipulation.' },
      { language: 'C++', code: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Ready for the Arena!";\n    return 0;\n}', notes: 'C++ is popular in competitive programming for its speed. Practice STL containers.' }
    ],
    quiz: [
      { question: 'What is the best way to improve at competitive coding?', options: ['Reading books only', 'Consistent practice and analyzing your mistakes', 'Watching others code', 'Copying solutions'], correctIndex: 1, explanation: 'Regular practice combined with reviewing your errors is the fastest path to improvement.' },
      { question: 'What is ELO rating used for?', options: ['Counting total wins', 'Matching you with similarly skilled opponents', 'Measuring code quality', 'Tracking login days'], correctIndex: 1, explanation: 'ELO matches you with opponents of similar rating so every match is fair and competitive.' },
      { question: 'What should you do after losing a match?', options: ['Give up', 'Review the solution and understand what you missed', 'Blame the internet', 'Skip the next match'], correctIndex: 1, explanation: 'Every loss is a learning opportunity. Review the problem, understand the solution, and come back stronger.' },
    ],
    codingChallenge: {
      title: 'Final Challenge: Two Sum',
      instructions: 'Write a function that takes an array of numbers and a target sum. Find two numbers in the array that add up to the target and return their indices. For the array [2, 7, 11, 15] and target 9, return [0, 1] because 2 + 7 = 9.',
      starterCode: '// Two Sum - return indices of two numbers that add to target\n\n',
      expectedOutput: '[0, 1]',
      hint: 'Use nested loops to check every pair. The outer loop picks the first number, the inner loop checks the rest.',
      testCases: [
        { input: '', expected: '0,1' }
      ],
      solution: 'function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}\nconsole.log(twoSum([2, 7, 11, 15], 9));'
    },
    commonMistakes: [
      'Overthinking simple problems — start with the brute force solution, then optimize.',
      'Not reading the problem carefully — many competitive programmers fail because they miss details.',
      'Giving up after one loss — every match is a learning opportunity, win or lose.'
    ],
    proTips: [
      'Start with easy Arena problems and gradually increase difficulty.',
      'Practice typing speed — faster coding = faster submissions.',
      'Learn from every match. Review the problems you got wrong.',
      'Join the DevRann community to discuss strategies and solutions.'
    ],
    summary: [
      'You have completed the beginner programming roadmap!',
      'The Arena is now open for competitive coding.',
      'ELO rating ensures fair matchmaking.',
      'Practice consistently to improve.',
      'Every loss is a learning opportunity.',
      'Welcome to the next level of your coding journey!'
    ],
    additionalResources: [
      { title: 'DevRann Arena', url: '/arena', platform: 'DevRann' },
      { title: 'Competitive Programming Guide', url: 'https://usaco.guide/', platform: 'USACO Guide' },
      { title: 'LeetCode', url: 'https://leetcode.com/', platform: 'LeetCode' },
      { title: 'CodeForces', url: 'https://codeforces.com/', platform: 'CodeForces' }
    ]
  }
];

export const totalLessons = lessons.length;
export const totalXP = lessons.reduce((sum, l) => sum + l.xpReward, 0);
