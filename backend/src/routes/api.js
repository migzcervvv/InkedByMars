import { Hono } from 'hono';
import { requireAdmin, requireSuperAdmin } from '../middlewares/workerAuth';
import { validate } from '../middlewares/input';
import booking from '../controllers/bookingController';
import schedule from '../controllers/scheduleController';
import auth from '../controllers/authController';
import publicController from '../controllers/publicController';
import bv from '../validators/bookingValidators';
import sv from '../validators/scheduleValidators';
import av from '../validators/authValidators';
import instagram from '../services/instagramService';
import { body } from 'express-validator';
import calendar from '../services/calendarClosures';
import settings from '../services/availabilitySettingsService';
import AppError from '../utils/AppError';

export const api = new Hono();
api.post('/auth/login', validate(av.loginValidators), auth.login);
api.post('/auth/register', ...requireSuperAdmin, validate(av.registerValidators), auth.register);
api.post('/auth/logout', ...requireAdmin, auth.logout);
api.get('/auth/me', ...requireAdmin, auth.getMe);
api.get('/auth/users', ...requireSuperAdmin, auth.listUsers);
api.post('/auth/users', ...requireSuperAdmin, validate(av.createUserValidators), auth.createUser);
api.put('/auth/users/:id', ...requireAdmin, validate(av.editUserValidators), auth.editUser);
api.delete('/auth/users/:id', ...requireSuperAdmin, validate(bv.mongoIdParam), auth.removeUser);
api.post('/auth/users/:id/reset-password', ...requireSuperAdmin, validate(av.resetUserPasswordValidators), auth.resetUserPassword);
api.get('/public/availability', validate(sv.rangeQueryValidators), publicController.getAvailability);
api.get('/public/availability/:date', validate(sv.dateParamValidator), publicController.getAvailabilityByDate);
api.post('/public/bookings', validate(bv.createBookingValidators), booking.createBooking);
api.use('/bookings/*', ...requireAdmin);
api.use('/schedule/*', ...requireAdmin);
api.get('/bookings/dashboard', booking.getDashboardStats);
api.get('/bookings', booking.getAllBookings);
api.post('/bookings', validate(bv.createBookingValidators), booking.createBooking);
api.get('/bookings/:id', validate(bv.mongoIdParam), booking.getBookingById);
api.put('/bookings/:id', validate([...bv.mongoIdParam, body('expectedUpdatedAt').isISO8601()]), booking.updateBooking);
api.delete('/bookings/:id', validate(bv.mongoIdParam), booking.deleteBooking);
api.put('/bookings/:id/confirm', validate(bv.confirmBookingValidators), booking.confirmBooking);
api.put('/bookings/:id/status', validate(bv.updateBookingStatusValidators), booking.updateBookingStatus);
api.get('/schedule', validate(sv.rangeQueryValidators), schedule.getAllSchedules);
api.get('/schedule/blocked-dates', validate(sv.monthQueryValidators), schedule.getBlockedDates);
api.get('/schedule/default-times', async c => c.json({ success: true, ...await settings.getDefaultSchedule() }));
api.put('/schedule/default-times', async c => c.json({ success: true, ...await settings.saveDefaultSchedule(c.get('input').body) }));
api.get('/schedule/:date', validate(sv.dateParamValidator), schedule.getScheduleByDate);
api.put('/schedule/:date/closure', validate([
  ...sv.dateParamValidator,
  body('action').isIn(['block-day', 'unblock-day', 'block-range', 'unblock-range']),
  body('version').custom(value => value === null || (Number.isSafeInteger(value) && value >= 0)),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
  body(['startTime', 'endTime']).if((_, { req }) => ['block-range', 'unblock-range'].includes(req.body.action)).matches(/^\d{2}:\d{2}$/),
]), async c => {
  const { params, body: operation } = c.get('input');
  const agenda = await calendar.changeClosure(params.date, operation);
  return c.json({ success: true, schedule: agenda });
});
api.post('/schedule/expire-holds', schedule.expireHolds);
api.get('/instagram/posts', async c => {
  const limit = Math.max(1, Math.min(Number.parseInt(c.req.query('limit'),10) || 18,50));
  const result = await instagram.getInstagramPosts(limit,c.req.query('cursor') || null);
  c.header('Cache-Control','public, max-age=300');
  return c.json({success:true,data:result.posts,pagination:{nextCursor:result.nextCursor,hasMore:result.hasMore},cache:{fromCache:result.fromCache,fetchedAt:result.fetchedAt}});
});
api.get('/instagram/profile', async c => c.json({success:true,data:await instagram.getInstagramProfile()}));
api.get('/instagram/me', async c => c.json({success:true,data:await instagram.getGraphMe()}));
api.get('/instagram/posts/:mediaId/children', async c => {
  if (!/^\d+$/.test(c.req.param('mediaId'))) throw new AppError('Invalid media ID.',400);
  return c.json({success:true,data:await instagram.getCarouselChildren(c.req.param('mediaId'))});
});
