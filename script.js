// Get DOM elements
const seedInput = document.getElementById('seed');
const generateBtn = document.getElementById('generate-btn');
const outputField = document.getElementById('output');

// Add event listener to generate button
generateBtn.addEventListener('click', generateNumber);

function generateNumber() {
  // Get seed number from input field
  const seed = seedInput.value;
  
  // Get current epoch time in seconds
 // const epochTime = Math.floor(Date.now() / 1000);

  // Get current epoch time in milliseconds
  const epochTime = Math.floor(Date.now());

  
  // Concatenate seed and epoch time
  const concatenated = `${seed}${epochTime}`;
  
  // Generate a hash from concatenated string
  const hash = hashCode(concatenated);
  
  // Convert hash to a number between 6 and 9 digits
  const min = 100000;
  const max = 999999999;
  const generatedNumber = Math.floor((hash % (max - min + 1)) + min);
  
  // Set output field value
  outputField.value = generatedNumber;
}

// Hash function
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
