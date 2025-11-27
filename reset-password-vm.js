const bcrypt = require('bcrypt');

const password = process.argv[2] || 'Eben2010';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log(hash);
});
