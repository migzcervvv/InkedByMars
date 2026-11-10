'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function seed() {
  const name = (process.env.SEED_ADMIN_NAME || 'Admin').trim();
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least eight characters).');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const collision = await Admin.findOne({ name, email: { $ne: email } });
  if (collision) throw new Error('This login name belongs to another account. No account was changed.');
  let admin = await Admin.findOne({ email }).select('+password');
  if (!admin) {
    admin = await Admin.create({ name, email, password, role: 'super_admin' });
    console.log(`Created seed account: ${admin.name} (${admin.email}).`);
  } else if (process.env.SEED_ADMIN_UPDATE === 'true') {
    admin.name = name;
    admin.password = password;
    admin.isActive = true;
    await admin.save();
    console.log(`Updated seed account: ${admin.name} (${admin.email}).`);
  } else if (admin.name !== name || !(await admin.comparePassword(password))) {
    throw new Error('Account exists with different credentials. Explicit SEED_ADMIN_UPDATE=true is required to update it.');
  }
  const verified = await Admin.findById(admin._id).select('+password');
  if (!verified.isActive || !(await verified.comparePassword(password))) throw new Error('Seed account verification failed.');
  console.log('Verified active account and bcrypt password hash.');
}
seed().catch(error => {
  const safe = error.name === 'MongooseServerSelectionError' ? 'Database connection failed; verify network access and MongoDB configuration.' : error.message;
  console.error('Seed failed:', safe);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
