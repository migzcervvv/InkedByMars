const { body, param } = require('express-validator');

const loginValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];
const identity = () => [
  body('name').isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage('Enter a username up to 100 characters'),
  body('email').isString().bail().trim().isEmail().withMessage('Provide a valid email address').normalizeEmail(),
];
const password = () => body('password').isString().bail()
  .custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password must be at most 72 bytes')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

module.exports = {
  loginValidators,
  registerValidators: [...identity(), password(), body('role').optional().isIn(['admin', 'super_admin'])],
  createUserValidators: [...identity(), password()],
  editUserValidators: [param('id').isMongoId(), ...identity(), password().optional(), body('currentPassword').optional().isString()],
};
