const bcrypt = require("bcrypt");

const plainPassword = "raj451";
const storedHash = "$2b$10$6fVdomUQX47sQ5o43o0JGOXaPAr0vNBICJTVVwLAs2JpMziNAEOPW";

bcrypt.compare(plainPassword, storedHash, (err, result) => {
    console.log("Password Matched:", result); // Should be true if stored correctly
});

