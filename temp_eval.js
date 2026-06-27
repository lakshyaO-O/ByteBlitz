const tests = [
  `function twoSum(nums, target) {
  // missing bracket`,
  `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement === 0) return [0, i];
  }
}`
];
for (const code of tests) {
  try {
    const runUserCode = new Function(code + "\nreturn typeof twoSum !== 'undefined' ? twoSum : undefined;");
    const userFn = runUserCode();
    console.log('OK', typeof userFn, userFn && userFn([2, 7, 11, 15], 9));
  } catch (err) {
    console.error('ERR', err.message);
  }
}
