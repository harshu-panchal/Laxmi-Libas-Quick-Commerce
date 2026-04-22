import PDFDocument from 'pdfkit';
import { IOrder } from '../models/Order';
import OrderItem from '../models/OrderItem';
import Seller from '../models/Seller';
import fs from 'fs';
import path from 'path';

export class PDFService {
  /**
   * Generates a professional invoice for an order
   */
  static async generateInvoice(order: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
      doc.moveDown();

      // Company Info (LaxMart)
      doc.fontSize(12).text('LaxMart Super App', { align: 'right' });
      doc.fontSize(10).text('Laxmi Nagar, Delhi, India', { align: 'right' });
      doc.text('GSTIN: 07AABCU1234F1Z5', { align: 'right' });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(10).text(`Invoice Number: ${order.invoiceNumber || 'INV-' + order.orderNumber}`, 50, 150);
      doc.text(`Order Number: ${order.orderNumber}`, 50, 165);
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 180);
      doc.moveDown();

      // Bill To & Seller Info
      doc.fontSize(12).text('Billed To:', 50, 210, { underline: true });
      doc.fontSize(10).text(order.customerName, 50, 225);
      doc.text(order.customerPhone, 50, 240);
      doc.text(order.deliveryAddress.address, 50, 255);
      doc.text(`${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}`, 50, 270);

      const seller = order.sellerId; // Assumes populated seller
      doc.fontSize(12).text('Seller Details:', 350, 210, { underline: true });
      doc.fontSize(10).text(seller?.storeName || 'LaxMart Seller', 350, 225);
      doc.text(seller?.address || '', 350, 240);
      if (seller?.taxNumber) doc.text(`GSTIN: ${seller.taxNumber}`, 350, 255);

      doc.moveDown(4);

      // Table Header
      const tableTop = 320;
      doc.fontSize(10).text('Product', 50, tableTop, { bold: true });
      doc.text('Price', 250, tableTop, { bold: true });
      doc.text('Qty', 350, tableTop, { bold: true });
      doc.text('Total', 450, tableTop, { bold: true });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Items
      let currentHeight = tableTop + 25;
      order.items.forEach((item: any) => {
        doc.text(item.productName, 50, currentHeight, { width: 180 });
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 250, currentHeight);
        doc.text(item.quantity.toString(), 350, currentHeight);
        doc.text(`₹${item.total.toFixed(2)}`, 450, currentHeight);
        currentHeight += 20;
      });

      doc.moveTo(50, currentHeight + 5).lineTo(550, currentHeight + 5).stroke();

      // Summary
      currentHeight += 20;
      doc.text('Subtotal:', 350, currentHeight);
      doc.text(`₹${order.subtotal.toFixed(2)}`, 450, currentHeight);

      currentHeight += 15;
      if (order.tax) {
        doc.text('Tax:', 350, currentHeight);
        doc.text(`₹${order.tax.toFixed(2)}`, 450, currentHeight);
        currentHeight += 15;
      }

      if (order.shipping) {
        doc.text('Shipping:', 350, currentHeight);
        doc.text(`₹${order.shipping.toFixed(2)}`, 450, currentHeight);
        currentHeight += 15;
      }

      doc.fontSize(12).text('Total:', 350, currentHeight, { bold: true });
      doc.text(`₹${order.total.toFixed(2)}`, 450, currentHeight, { bold: true });

      // Footer
      doc.fontSize(10).text('This is a computer-generated invoice and does not require a signature.', 50, 700, { align: 'center', color: 'gray' });

      doc.end();
    });
  }

  /**
   * Generates a professional shipping label
   */
  static async generateShippingLabel(order: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: [400, 600], margin: 20 });
    const buffers: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Label Header
      doc.fontSize(18).text('LaxMart Shipping', { align: 'center', bold: true });
      doc.moveTo(20, 50).lineTo(380, 50).stroke();

      // Tracking ID
      doc.moveDown();
      doc.fontSize(14).text(`Tracking ID: ${order.trackingId || 'T-' + order.orderNumber}`, { align: 'center' });
      doc.moveDown();

      // Ship To
      doc.fontSize(12).text('SHIP TO:', { underline: true });
      doc.fontSize(14).text(order.customerName, { bold: true });
      doc.fontSize(12).text(order.deliveryAddress.address);
      doc.text(`${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}`);
      doc.text(`${order.deliveryAddress.state || ''}`);
      doc.text(`Phone: ${order.customerPhone}`);

      doc.moveDown(2);

      // Return Address / Ship From
      const seller = order.sellerId;
      doc.fontSize(10).text('SHIP FROM:', { underline: true });
      doc.fontSize(10).text(seller?.storeName || 'LaxMart Seller');
      doc.text(seller?.address || '');
      doc.text(`Phone: ${seller?.mobile || ''}`);

      doc.moveDown(2);

      // Order Contents
      doc.fontSize(10).text('ORDER DETAILS:', { underline: true });
      order.items.forEach((item: any) => {
        doc.text(`${item.productName} x ${item.quantity}`);
      });

      // Footer
      doc.moveTo(20, 550).lineTo(380, 550).stroke();
      doc.fontSize(8).text('Marketplace: laxmart.com | Order ID: ' + order.orderNumber, 20, 560, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generates a professional stay invoice for hotel bookings
   */
  static async generateHotelStayInvoice(booking: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('STAY SUMMARY & INVOICE', { align: 'center', bold: true });
      doc.moveDown();

      // Hotel Info
      const hotel = booking.hotelId;
      doc.fontSize(14).text(hotel?.name || 'Hotel Partner', { align: 'right', bold: true });
      doc.fontSize(10).text(hotel?.address || '', { align: 'right' });
      doc.text(`${hotel?.city || ''}, ${hotel?.pincode || ''}`, { align: 'right' });
      doc.moveDown();

      // Booking Details
      doc.fontSize(10).text(`Booking Reference: ${booking._id.toString().toUpperCase().slice(-8)}`, 50, 150);
      doc.text(`Guest Name: ${booking.userId?.name || 'Valued Guest'}`, 50, 165);
      doc.text(`Check-In: ${new Date(booking.checkIn).toLocaleDateString()}`, 50, 180);
      doc.text(`Check-Out: ${new Date(booking.checkOut).toLocaleDateString()}`, 50, 195);
      doc.moveDown();

      // Stay Details Table
      const tableTop = 230;
      doc.fontSize(12).text('Description', 50, tableTop, { bold: true });
      doc.text('Rooms', 250, tableTop, { bold: true });
      doc.text('Guests', 350, tableTop, { bold: true });
      doc.text('Total', 450, tableTop, { bold: true });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      const stayDays = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      
      doc.fontSize(10).text(`${booking.roomId?.roomType || 'Standard Room'} - ${stayDays} Nights`, 50, tableTop + 25);
      doc.text('1', 250, tableTop + 25);
      doc.text(booking.guests.toString(), 350, tableTop + 25);
      doc.text(`₹${booking.totalAmount.toFixed(2)}`, 450, tableTop + 25);

      doc.moveTo(50, tableTop + 45).lineTo(550, tableTop + 45).stroke();

      // Summary
      doc.moveDown(4);
      doc.fontSize(12).text(`Grand Total: ₹${booking.totalAmount.toFixed(2)}`, { align: 'right', bold: true });
      doc.fontSize(10).text(`Payment Status: ${booking.paymentStatus}`, { align: 'right' });

      // Footer
      doc.fontSize(10).text('Thank you for choosing LaxMart Travel. Hope to see you again!', 50, 700, { align: 'center', color: 'gray' });

      doc.end();
    });
  }

  /**
   * Generates a passenger manifest for bus operators
   */
  static async generateBusManifest(bus: any, bookings: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, layout: 'landscape' });
    const buffers: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text('PASSENGER MANIFEST', { align: 'center', bold: true });
      doc.moveDown();

      // Bus & Trip Info
      doc.fontSize(12).text(`Bus: ${bus.busName} (${bus.busNumber})`, { bold: true });
      doc.text(`Route: ${bus.from} to ${bus.to}`);
      doc.text(`Departure: ${new Date(bus.departureTime).toLocaleString()}`);
      doc.moveDown();

      // Manifest Table
      const tableTop = 150;
      doc.fontSize(10).text('S.No', 50, tableTop, { bold: true });
      doc.text('Passenger Name', 100, tableTop, { bold: true });
      doc.text('Phone', 300, tableTop, { bold: true });
      doc.text('Seat(s)', 450, tableTop, { bold: true });
      doc.text('Status', 550, tableTop, { bold: true });
      doc.text('Amount', 650, tableTop, { bold: true });

      doc.moveTo(50, tableTop + 15).lineTo(750, tableTop + 15).stroke();

      let currentHeight = tableTop + 25;
      bookings.forEach((booking, index) => {
        doc.text((index + 1).toString(), 50, currentHeight);
        doc.text(booking.userId?.name || 'Guest', 100, currentHeight);
        doc.text(booking.userId?.mobile || 'N/A', 300, currentHeight);
        doc.text(booking.seats?.join(', ') || 'Auto', 450, currentHeight);
        doc.text(booking.status, 550, currentHeight);
        doc.text(`₹${booking.amount}`, 650, currentHeight);
        
        currentHeight += 20;

        if (currentHeight > 500) {
            doc.addPage({ layout: 'landscape' });
            currentHeight = 50;
        }
      });

      // Summary
      doc.moveDown();
      doc.text(`Total Passengers: ${bookings.length}`, { bold: true });

      doc.end();
    });
  }

  /**
   * Generates a professional bus ticket for customers
   */
  static async generateBusTicket(booking: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const schedule = booking.scheduleId;
      const bus = schedule?.busId;
      const route = schedule?.routeId;

      // Ticket Header
      doc.fontSize(22).text('E-TICKET', { align: 'center', bold: true });
      doc.fontSize(10).text('LaxMart Travel', { align: 'center' });
      doc.moveDown();

      // Trip Summary
      doc.rect(50, 100, 500, 100).fill('#f9f9f9').stroke('#eeeeee');
      doc.fillColor('black').fontSize(14).text(`${route?.from || 'Source'} \u2192 ${route?.to || 'Destination'}`, 60, 115, { bold: true });
      doc.fontSize(10).text(`Operator: ${bus?.operatorName || 'Laxmi Travels'}`, 60, 135);
      doc.text(`Bus: ${bus?.busName || 'Deluxe'} (${bus?.busNumber || ''})`, 60, 150);
      doc.text(`Date & Time: ${new Date(schedule?.departureDate).toLocaleDateString()} at ${schedule?.departureTime}`, 60, 165);

      // Passenger Details
      doc.moveDown(5);
      doc.fontSize(12).text('PASSENGER DETAILS', { underline: true });
      doc.moveDown();
      
      booking.seats.forEach((seat: any, i: number) => {
          doc.fontSize(10).text(`${i+1}. ${seat.passengerName} (${seat.passengerAge}, ${seat.passengerGender}) - Seat: ${seat.seatNumber}`);
      });

      // Boarding Details
      doc.moveDown(2);
      doc.fontSize(12).text('BOARDING & DROPOFF', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Pickup: ${booking.pickupPoint}`, { bold: true });
      doc.text(`Dropoff: ${booking.dropoffPoint}`, { bold: true });

      // Important Instructions
      doc.moveDown(3);
      doc.fontSize(8).fillColor('gray').text('IMPORTANT INSTRUCTIONS:', { bold: true });
      doc.text('1. Please carry a valid government ID proof.');
      doc.text('2. Reach the boarding point 15 minutes before departure.');
      doc.text('3. This ticket is non-transferable.');

      doc.end();
    });
  }

}
