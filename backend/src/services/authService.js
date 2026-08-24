const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { memoryDb } = require('../config/database');
const { JWT_SECRET } = require('../config/env');

class AuthService {
  async register({ name, email, password, role, phone, address }) {
    const existing = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = `usr-${Date.now()}`;

    const newUser = {
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'CUSTOMER',
      phone: phone || '',
      address: address || '',
      isAvailable: true,
      currentZoneId: null,
      currentLocation: null
    };

    memoryDb.users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        address: newUser.address
      }
    };
  }

  async login({ email, password }) {
    const user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isAvailable: user.isAvailable
      }
    };
  }
}

module.exports = new AuthService();
