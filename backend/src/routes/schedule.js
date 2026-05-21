'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllSchedules,
  getScheduleByDate,
  blockDay,
  blockSlot,
  releaseSlot,
  overrideSlot,
  expireHolds,
} = require('../controllers/scheduleController');

const {
  dateParamValidator,
  blockDayValidators,
  blockSlotValidators,
  releaseSlotValidators,
  rangeQueryValidators,
} = require('../validators/scheduleValidators');

const { body } = require('express-validator');
const { SLOT_STATUS } = require('../config/constants');
const validate = require('../middlewares/validate');
const { requireAdmin } = require('../middlewares/auth');

router.use(requireAdmin);

router.get('/', rangeQueryValidators, validate, getAllSchedules);
router.get('/:date', dateParamValidator, validate, getScheduleByDate);

router.post('/block-day', blockDayValidators, validate, blockDay);
router.post('/block-slot', blockSlotValidators, validate, blockSlot);
router.post('/release-slot', releaseSlotValidators, validate, releaseSlot);

router.post(
  '/override-slot',
  [
    ...blockSlotValidators,
    body('status')
      .notEmpty()
      .isIn(Object.values(SLOT_STATUS))
      .withMessage(`Status must be one of: ${Object.values(SLOT_STATUS).join(', ')}`),
  ],
  validate,
  overrideSlot
);

router.post('/expire-holds', expireHolds);

module.exports = router;
