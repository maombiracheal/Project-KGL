const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/karibu-project';

const users = [
  {
    // use a single-word username for the director so login is straightforward.
    // registration and login logic strip spaces, so "Director" or "Mr Orban"
    // would both normalize to "director" anyway, but an explicit alias
    // reduces confusion.
    username: 'director',
    password: 'Director@123',
    fullName: 'Mr. Orban',
    role: 'Director',
  },
  {
    username: 'manager.maganjo',
    password: 'Manager@123',
    fullName: 'Manager Maganjo',
    role: 'Manager',
    branch: 'Maganjo',
  },
  {
    username: 'manager.matugga',
    password: 'Manager@123',
    fullName: 'Manager Matugga',
    role: 'Manager',
    branch: 'Matugga',
  },
  {
    username: 'agent.maganjo',
    password: 'Agent@123',
    fullName: 'Sales Agent Maganjo',
    role: 'Sales Agent',
    branch: 'Maganjo',
  },
  {
    username: 'agent.matugga',
    password: 'Agent@123',
    fullName: 'Sales Agent Matugga',
    role: 'Sales Agent',
    branch: 'Matugga',
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log(`Successfully connected to MongoDB at: ${mongoUri}`);

    console.log('Starting user seeding process...');
    for (const entry of users) {
      try {
        const username = entry.username.toLowerCase();

        // Delete all potential duplicates for the user to ensure a clean slate.
        await User.deleteMany({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        // Create a fresh, clean user record with a hashed password.
        const hashedPassword = await bcrypt.hash(entry.password, 10);
        const newUser = {
          username: username,
          password: hashedPassword,
          fullName: entry.fullName,
          role: entry.role,
        };

        if (entry.role !== 'Director') {
          newUser.branch = entry.branch;
        }

        const createdUser = await User.create(newUser);
        console.log(`- Successfully created user: ${createdUser.username}`);
      } catch (userError) {
        console.error(`- FAILED to create user: ${entry.username}. Reason:`, userError.message);
      }
    }

    console.log('User seeding complete. Credentials:');
    users.forEach((u) => {
      console.log(`- ${u.username} | ${u.role}${u.branch ? ` (${u.branch})` : ''} | password: ${u.password}`);
    });
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedUsers();
