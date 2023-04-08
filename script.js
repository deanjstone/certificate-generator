function generateNumber() {
  const input = document.getElementById("input").value;
  const epoch = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
  const seed = input + epoch;
  const hash = CryptoJS.SHA384(seed.toString()).toString();
  const number = parseInt(hash.slice(0, 9), 16); // Take the first 9 hex digits and convert to decimal
  const uniqueNumber = (number % 40000000) + 10000000; // Convert to 7 digits, starting with 1
  document.getElementById("output").textContent = uniqueNumber;
}

document
  .getElementById("generate-btn")
  .addEventListener("click", generateNumber);
