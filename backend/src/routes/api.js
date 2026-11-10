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
import AppError from '../utils/AppError';

export const api = new Hono();
api.post('/auth/login', validate(av.loginValidators), auth.login);
api.post('/auth/register', ...requireSuperAdmin, validate(av.registerValidators), auth.register);
api.post('/auth/logout', ...requireAdmin, auth.logout);
api.get('/auth/me', ...requireAdmin, auth.getMe);
api.get('/public/availability', validate(sv.rangeQueryValidators), publicController.getAvailability);
api.get('/public/availability/:date', validate(sv.dateParamValidator), publicController.getAvailabilityByDate);
api.post('/public/bookings', validate(bv.createBookingValidators), booking.createBooking);
api.use('/bookings/*', ...requireAdmin);
api.use('/schedule/*', ...requireAdmin);
api.get('/bookings/dashboard', booking.getDashboardStats);
api.get('/bookings', ...requireAdmin, booking.getAllBookings);
api.post('/bookings', ...requireAdmin, validate(bv.createBookingValidators), booking.createBooking);
api.get('/bookings/:id', validate(bv.mongoIdParam), booking.getBookingById);
api.put('/bookings/:id', validate(bv.mongoIdParam), booking.updateBooking);
api.delete('/bookings/:id', validate(bv.mongoIdParam), booking.deleteBooking);
api.put('/bookings/:id/confirm', validate(bv.confirmBookingValidators), booking.confirmBooking);
api.put('/bookings/:id/status', validate(bv.updateBookingStatusValidators), booking.updateBookingStatus);
api.get('/schedule', ...requireAdmin, validate(sv.rangeQueryValidators), schedule.getAllSchedules);
api.get('/schedule/blocked-dates', validate(sv.monthQueryValidators), schedule.getBlockedDates);
api.put('/schedule/blocked-dates', validate(sv.blockedDatesValidators), schedule.updateBlockedDates);
api.get('/schedule/:date', validate(sv.dateParamValidator), schedule.getScheduleByDate);
for (const [path, validators, handler] of [
  ['block-day',sv.blockDayValidators,schedule.blockDay],['block-slot',sv.blockSlotValidators,schedule.blockSlot],
  ['release-slot',sv.releaseSlotValidators,schedule.releaseSlot],['opening-window',sv.applyOpeningWindowValidators,schedule.applyOpeningWindow],
  ['override-slot',[...sv.blockSlotValidators,body('status').isIn(['available','booked','on-hold','closed'])],schedule.overrideSlot],
  ['expire-holds',[],schedule.expireHolds],
]) api.post(`/schedule/${path}`,validate(validators),handler);
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
