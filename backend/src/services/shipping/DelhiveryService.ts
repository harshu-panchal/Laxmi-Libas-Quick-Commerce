import axios from 'axios';
import Order from '../../models/Order';
import { ISeller } from '../../models/Seller';

const DELHIVERY_API_URL = process.env.DELHIVERY_API_BASE_URL || 'https://track.delhivery.com';
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN;

interface DelhiveryShipmentParams {
    orderNumber: string;
    add: string; // Customer Address
    phone: string;
    payment_mode: 'Prepaid' | 'COD';
    name: string;
    pin: string;
    sellerName: string;
    sellerAddress: string;
    sellerPhone: string;
    sellerCity: string;
    sellerPin: string;
    weight: number;
    totalAmount: number;
}

export class DelhiveryService {
    /**
     * Create a shipment in Delhivery
     */
    static async createShipment(params: DelhiveryShipmentParams) {
        if (!DELHIVERY_TOKEN) {
            throw new Error('Delhivery API token not configured in environment');
        }

        const data = {
            shipments: [
                {
                    add: params.add,
                    address_type: "home",
                    phone: params.phone,
                    payment_mode: params.payment_mode,
                    name: params.name,
                    pin: params.pin,
                    order: params.orderNumber,
                    h_phone: params.sellerPhone, // Pickup contact
                    pickup_location: params.sellerName, // Warehouse name registered in Delhivery
                    shipping_mode: "Surface",
                    quantity: "1",
                    total_amount: params.totalAmount, // Used for COD
                    seller_name: params.sellerName,
                    seller_address: params.sellerAddress,
                    seller_city: params.sellerCity,
                    seller_pin: params.sellerPin,
                    weight: params.weight, // In Grams or KG depending on account settings, usually KG
                }
            ],
            pickup_location: {
                name: params.sellerName,
                add: params.sellerAddress,
                city: params.sellerCity,
                pin: params.sellerPin,
                phone: params.sellerPhone
            }
        };

        try {
            const response = await axios.post(
                `${DELHIVERY_API_URL}/api/cmu/create.json`,
                `format=json&data=${JSON.stringify(data)}`,
                {
                    headers: {
                        'Authorization': `Token ${DELHIVERY_TOKEN}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Delhivery Create Shipment Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Track a shipment using Waybill (AWB) or Order Number
     */
    static async trackShipment(trackingId: string) {
        if (!DELHIVERY_TOKEN) {
            throw new Error('Delhivery API token not configured in environment');
        }

        try {
            const response = await axios.get(
                `${DELHIVERY_API_URL}/api/v1/packages/json/?waybill=${trackingId}`,
                {
                    headers: {
                        'Authorization': `Token ${DELHIVERY_TOKEN}`
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Delhivery Tracking Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Cancel a shipment
     */
    static async cancelShipment(waybill: string) {
        if (!DELHIVERY_TOKEN) {
            throw new Error('Delhivery API token not configured in environment');
        }

        const data = {
            waybill: waybill,
            cancellation: true
        };

        try {
            const response = await axios.post(
                `${DELHIVERY_API_URL}/api/p/edit.json`,
                `format=json&data=${JSON.stringify(data)}`,
                {
                    headers: {
                        'Authorization': `Token ${DELHIVERY_TOKEN}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Delhivery Cancel Shipment Error:', error.response?.data || error.message);
            throw error;
        }
    }
}
