const bcrypt = require('bcryptjs');

const password = 'password123';
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nTest comparison:', bcrypt.compareSync(password, hash));
