'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  const existing = await Admin.findOne({ email: process.env.SEED_ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${process.env.SEED_ADMIN_EMAIL}`);
    process.exit(0);
  }

  await Admin.create({
    name: process.env.SEED_ADMIN_NAME || 'Admin',
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: 'super_admin',
  });

  console.log(`Super admin created: ${process.env.SEED_ADMIN_EMAIL}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
