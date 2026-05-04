import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrderById, updateOrderStatus, shipOrder, markAsPacked, readyForPickup, OrderDetail } from '../../../services/api/orderService';
import jsPDF from 'jspdf';
import { Truck, Package, RefreshCw, CheckCircle, ExternalLink, MapPin, Clock, Navigation, ChevronLeft } from 'lucide-react';
import LiveTrackingMap from '../../../components/LiveTrackingMap';
import { useDeliveryTracking } from '../../../hooks/useDeliveryTracking';
import { motion } from 'framer-motion';

export default function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('Out for Delivery');

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError('');
      try {
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrderDetail(response.data);
          setOrderStatus(response.data.status);
        } else {
          setError(response.message || 'Failed to fetch order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetail) return;

    try {
      let response;
      if (newStatus === 'Shipped') {
        const courierPartner = window.prompt('Enter Courier Partner Name (Optional):', 'Delhivery') || undefined;
        response = await shipOrder(orderDetail.id, courierPartner);
      } else if (newStatus === 'Packed') {
        response = await markAsPacked(orderDetail.id);
      } else if (newStatus === 'Ready for pickup') {
        response = await readyForPickup(orderDetail.id);
      } else {
        response = await updateOrderStatus(orderDetail.id, { status: newStatus as any });
      }

      if (response.success) {
        setOrderStatus(newStatus);
        const updatedData: any = { ...orderDetail, status: newStatus as any };
        if (newStatus === 'Shipped' && (response.data as any).trackingId) {
            updatedData.trackingId = (response.data as any).trackingId;
            updatedData.courierPartner = (response.data as any).courierPartner;
        }
        setOrderDetail(updatedData);
      } else {
        alert(response.message || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleDownloadInvoice = () => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_BASE_URL}/orders/${id}/invoice?token=${token}`;
    window.open(url, '_blank');
  };

  const handleDownloadLabel = () => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_BASE_URL}/orders/${id}/shipping-label?token=${token}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-neutral-500">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/seller/orders')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/seller/orders')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    return `${day}${suffix} ${month}, ${year}`;
  };

  const handleExportPDF = () => {
    if (!orderDetail) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header - Company Info
    doc.setFillColor(22, 163, 74); // Green color
    doc.rect(margin, yPos, contentWidth, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LaxMart', margin + 5, yPos + 10);

    yPos += 20;

    // Company Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LaxMart', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('From: LaxMart', margin, yPos);
    yPos += 6;
    doc.text('Phone: 8956656429', margin, yPos);
    yPos += 6;
    doc.text('Email: info@LaxMart.com', margin, yPos);
    yPos += 6;
    doc.text('Website: https://LaxMart.com', margin, yPos);
    yPos += 12;

    // Invoice Details (Right aligned)
    const rightX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(orderDetail.orderDate)}`, rightX, yPos - 30, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #${orderDetail.invoiceNumber}`, rightX, yPos - 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: ${orderDetail.id}`, rightX, yPos - 14, { align: 'right' });
    doc.text(`Delivery Date: ${formatDate(orderDetail.deliveryDate)}`, rightX, yPos - 8, { align: 'right' });
    doc.text(`Time Slot: ${orderDetail.timeSlot}`, rightX, yPos - 2, { align: 'right' });

    // Status badge
    const statusWidth = doc.getTextWidth(orderStatus) + 8;
    doc.setFillColor(59, 130, 246); // Blue for status
    doc.roundedRect(rightX - statusWidth, yPos + 2, statusWidth, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(orderStatus, rightX - statusWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 15;
    doc.setTextColor(0, 0, 0);

    // Draw a line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Table Header
    checkPageBreak(20);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    const colWidths = [
      contentWidth * 0.08,  // Sr. No.
      contentWidth * 0.40,  // Product
      contentWidth * 0.15,  // Price
      contentWidth * 0.15,  // Tax
      contentWidth * 0.10,  // Qty
      contentWidth * 0.12,  // Subtotal
    ];

    let xPos = margin;
    const headers = ['Sr. No.', 'Product', 'Price', 'Tax ? (%)', 'Qty', 'Subtotal'];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[index];
    });

    yPos += 12;

    // Table Rows
    orderDetail.items.forEach((item) => {
      checkPageBreak(15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      xPos = margin;
      const rowData = [
        item.srNo.toString(),
        item.product,
        `?${item.price.toFixed(2)}`,
        `${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)`,
        item.qty.toString(),
        `?${item.subtotal.toFixed(2)}`,
      ];

      rowData.forEach((data, index) => {
        // Truncate long text
        const maxWidth = colWidths[index] - 4;
        let text = data;
        if (doc.getTextWidth(text) > maxWidth && index === 1) {
          // Truncate product name if too long
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });

      // Draw row separator
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      yPos += 10;
    });

    // Calculate totals
    const totalSubtotal = orderDetail.subtotal;
    const totalTax = orderDetail.tax;
    const grandTotal = orderDetail.grandTotal;

    yPos += 5;
    checkPageBreak(30);

    // Totals Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`?${totalSubtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text('Tax:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`?${totalTax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`?${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Footer
    checkPageBreak(20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Bill Generated by LaxMart', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(8);
    doc.text('Copyright © 2025. Developed By LaxMart', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    const fileName = `Invoice_${orderDetail.invoiceNumber}_${orderDetail.id}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border border-blue-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-400';
      case 'Out for Delivery':
        return 'bg-blue-600 text-white border border-blue-700 font-bold';
      case 'On the way':
        return 'bg-purple-100 text-purple-800 border border-purple-400';
      case 'Delivered':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-400';
      case 'Shipped':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-400 font-medium';
      case 'Packed':
        return 'bg-teal-100 text-teal-800 border border-teal-400 font-medium';
      case 'Ready for pickup':
        return 'bg-pink-100 text-pink-800 border border-pink-400 font-medium';
      case 'Received':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Payment Pending':
        return 'bg-orange-50 text-orange-600 border border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const formatUnit = (unit: string, qty: number) => {
    if (!unit || unit === 'N/A') return 'N/A';

    // improved regex to handle decimals and various spacing
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const u = match[2];
      // check if val is a valid number
      if (!isNaN(val)) {
        const total = val * qty;
        // Format to remove trailing zeros if integer (e.g. 1.0 -> 1)
        return `${parseFloat(total.toFixed(2))}${u}`;
      }
    }
    return `${unit} x ${qty}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      {/* Shipment Control Center */}
      <div className="bg-white mb-6 rounded-2xl shadow-lg border border-neutral-200 overflow-hidden mx-4 sm:mx-0 mt-6 md:mt-0">
        <div className="bg-[#121212] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Marketplace Fulfillment HUD</h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Ecommerce Control Center v2.0</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadInvoice} title="Download Professional Tax Invoice" className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors text-white border border-neutral-700">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </button>
            <button onClick={handleDownloadLabel} title="Generate Shipping Label" className="p-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-white shadow-lg shadow-teal-500/20 border border-teal-500">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 8h10"></path><path d="M7 12h10"></path><path d="M7 16h6"></path></svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Live Tracking Card (Quick Commerce) */}
          {orderDetail.orderType === 'quick' && (orderStatus === 'Out for Delivery' || orderStatus === 'Picked up' || orderStatus === 'Delivered') && (
            <div className="mb-8 bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
                 <div className="flex items-center gap-2">
                    <Navigation className="text-teal-600" size={20} />
                    <h2 className="text-base font-bold text-neutral-900">Live Delivery Progress</h2>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <motion.div 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-teal-500"
                    />
                    Live Tracking Enabled
                 </div>
              </div>
              <div className="h-[250px] relative">
                <SellerLiveTrackingWrapper id={id!} orderDetail={orderDetail} />
              </div>
            </div>
          )}

          {/* Progress Steps for Ecommerce */}
          {orderDetail.orderType === 'ecommerce' && (
            <div className="mb-8 relative">
              <div className="absolute top-5 left-0 w-full h-1 bg-neutral-100 -z-0"></div>
              <div 
                className="absolute top-5 left-0 h-1 bg-teal-500 transition-all duration-500 -z-0"
                style={{ 
                  width: orderStatus === 'Received' ? '0%' : 
                         orderStatus === 'Accepted' ? '25%' :
                         orderStatus === 'Packed' ? '50%' :
                         orderStatus === 'Ready for pickup' ? '75%' : 
                         orderStatus === 'Shipped' || orderStatus === 'Delivered' ? '100%' : '0%'
                }}
              ></div>
              
              <div className="flex justify-between relative z-10">
                {[
                  { id: 'Received', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, label: 'Order Received' },
                  { id: 'Accepted', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, label: 'Accepted' },
                  { id: 'Packed', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>, label: 'Packed' },
                  { id: 'Ready for pickup', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, label: 'Ready' },
                  { id: 'Shipped', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>, label: 'Dispatched' },
                ].map((step, idx) => {
                  const isCompleted = ['Delivered', 'Shipped', 'Ready for pickup', 'Packed', 'Accepted', 'Received'].indexOf(orderStatus) >= ['Delivered', 'Shipped', 'Ready for pickup', 'Packed', 'Accepted', 'Received'].indexOf(step.id);
                  const isCurrent = orderStatus === step.id;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                        isCompleted ? "bg-teal-500 border-white text-white shadow-lg shadow-teal-500/20" : 
                        "bg-white border-neutral-100 text-neutral-300"
                      } ${isCurrent ? "scale-125 z-20 border-teal-500 ring-4 ring-teal-50" : ""}`}>
                        {step.icon}
                      </div>
                      <span className={`text-[10px] font-bold mt-2 uppercase tracking-tighter ${isCompleted ? "text-teal-600" : "text-neutral-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <div className="flex-1 w-full space-y-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Next Recommended Action</p>
              
              {orderStatus === 'Received' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(orderDetail.orderType === 'ecommerce' ? 'Accepted' : 'Accepted')}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"></path></svg>
                    Accept Order
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reject this order? This cannot be undone.')) {
                        handleStatusUpdate('Rejected');
                      }
                    }}
                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Reject
                  </button>
                </div>
              ) : orderStatus === 'Accepted' && orderDetail.orderType === 'ecommerce' ? (
                <button
                  onClick={() => handleStatusUpdate('Packed')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  Generate Invoice & Pack Order
                </button>
              ) : orderStatus === 'Packed' && orderDetail.orderType === 'ecommerce' ? (
                <button
                  onClick={() => handleStatusUpdate('Ready for pickup')}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Mark as Ready for Pickup
                </button>
              ) : orderStatus === 'Ready for pickup' && orderDetail.orderType === 'ecommerce' ? (
                <button
                  onClick={() => handleStatusUpdate('Shipped')}
                  className="w-full bg-[#121212] hover:bg-neutral-800 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  Handover to Courier (Mark Shipped)
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={orderStatus}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl font-bold text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={['Rejected', 'Cancelled', 'Delivered'].includes(orderStatus)}
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Packed">Packed</option>
                    <option value="Ready for pickup">Ready for Pickup</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    {orderStatus === 'Rejected' && <option value="Rejected">Rejected</option>}
                  </select>
                </div>
              )}
            </div>
            
            <div className="hidden md:block w-px h-16 bg-neutral-200 mx-6"></div>

            <div className="flex gap-3">
               <button onClick={handlePrint} className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-xl transition-all text-xs font-bold border border-neutral-200">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                 Quick Print
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Order Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">View Order Details</h2>
        </div>
        <div className="bg-white px-4 sm:px-6 py-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
            {/* Left: Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary-dark rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div>
                  <div className="text-xs text-primary-dark font-semibold">LaxMart</div>
                  <div className="text-[10px] text-primary-dark">Online Store</div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">LaxMart</h1>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">From:</span> LaxMart
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <div>
                  <span className="font-medium">Phone:</span> 8956656429
                </div>
                <div>
                  <span className="font-medium">Email:</span> info@LaxMart.com
                </div>
                <div>
                  <span className="font-medium">Website:</span> https://LaxMart.com
                </div>
              </div>
            </div>

            {/* Right: Invoice Details */}
            <div className="flex-1 lg:text-right">
              <div className="text-sm text-neutral-600 mb-4">
                <span className="font-medium">Date:</span> {formatDate(orderDetail.orderDate)}
              </div>
              <div className="text-lg font-semibold text-neutral-900 mb-1">Invoice #{orderDetail.invoiceNumber}</div>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">Order ID:</span> {orderDetail.id}
              </div>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">Delivery Date:</span> {formatDate(orderDetail.deliveryDate)}
              </div>
              <div className="text-sm text-neutral-600 mb-3">
                <span className="font-medium">Time Slot:</span> {orderDetail.timeSlot}
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <span className="text-sm font-medium text-neutral-700">Order Status:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(orderStatus)}`}>
                  {orderStatus}
                </span>
              </div>
              
              {orderDetail.trackingId && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg lg:text-right">
                  <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Shipping Details</div>
                  <div className="text-sm text-neutral-800">
                    <span className="font-medium">Courier:</span> {orderDetail.courierPartner}
                  </div>
                  <div className="text-sm text-neutral-800">
                    <span className="font-medium">Tracking:</span> <span className="font-bold">{orderDetail.trackingId}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[800px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Sr. No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tax ? (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {orderDetail.items.map((item) => (
                  <tr key={item.srNo}>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.srNo}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      <div className="flex items-center gap-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.product}
                            className="h-12 w-12 rounded-lg border border-neutral-200 object-cover bg-neutral-50"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg border border-neutral-200 bg-neutral-100" />
                        )}
                        <div>
                          <div className="font-medium text-neutral-900">{item.product}</div>
                          <div className="text-xs text-neutral-500">{item.soldBy}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{formatUnit(item.unit, item.qty)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-bold">{item.size || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-bold">{item.color || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">?{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {item.tax.toFixed(2)} ({item.taxPercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900 font-medium">?{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Customer & Delivery</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <div><span className="font-medium">Customer:</span> {orderDetail.customerName || 'N/A'}</div>
                <div><span className="font-medium">Phone:</span> {orderDetail.customerPhone || 'N/A'}</div>
                <div><span className="font-medium">Email:</span> {orderDetail.customerEmail || 'N/A'}</div>
                <div><span className="font-medium">Address:</span> {orderDetail.deliveryAddress?.address || 'N/A'}</div>
                <div>
                  <span className="font-medium">City/Pincode:</span>{' '}
                  {[orderDetail.deliveryAddress?.city, orderDetail.deliveryAddress?.pincode].filter(Boolean).join(' - ') || 'N/A'}
                </div>
                <div><span className="font-medium">Delivery Boy:</span> {orderDetail.deliveryBoyName || 'Not assigned'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Invoice Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span className="font-medium">Rs {orderDetail.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Tax</span>
                  <span className="font-medium">Rs {orderDetail.tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Payment Method</span>
                  <span className="font-medium">{orderDetail.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Payment Status</span>
                  <span className="font-medium">{orderDetail.paymentStatus}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-base font-semibold text-neutral-900">
                  <span>Grand Total</span>
                  <span>Rs {orderDetail.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Generation Note */}
          <div className="border-t border-dashed border-neutral-300 pt-4">
            <p className="text-sm text-neutral-600 text-center">
              Bill Generated by LaxMart
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 px-4 sm:px-6 text-center py-4 bg-neutral-100 rounded-lg">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © 2025. Developed By{' '}
          <span className="font-semibold text-teal-600">LaxMart</span>
        </p>
      </footer>
    </div>
  );
}

/**
 * Specialized Wrapper for Seller Tracking to isolate socket hook
 */
function SellerLiveTrackingWrapper({ id, orderDetail }: { id: string, orderDetail: any }) {
  const { 
    deliveryLocation, 
    isConnected 
  } = useDeliveryTracking(id);

  return (
    <LiveTrackingMap 
      deliveryLocation={deliveryLocation || (orderDetail.currentLocation ? { lat: orderDetail.currentLocation.lat, lng: orderDetail.currentLocation.lng } : undefined)}
      customerLocation={{ 
        lat: orderDetail.deliveryAddress?.latitude || 0, 
        lng: orderDetail.deliveryAddress?.longitude || 0 
      }}
      isTracking={isConnected}
    />
  );
}


