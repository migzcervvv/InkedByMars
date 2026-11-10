require('dotenv').config();
const mongoose=require('mongoose');
require('../src/models/Admin');require('../src/models/Booking');require('../src/models/Schedule');require('../src/models/AvailabilitySettings');
(async()=>{if(!process.env.MONGO_URI)throw new Error('MONGO_URI is required.');await mongoose.connect(process.env.MONGO_URI);for(const name of mongoose.modelNames())await mongoose.model(name).createIndexes();console.log('Created/verified application indexes without dropping indexes.');})().catch(()=>{console.error('Index initialization failed. Check the selected database and existing duplicates.');process.exitCode=1;}).finally(()=>mongoose.disconnect());
