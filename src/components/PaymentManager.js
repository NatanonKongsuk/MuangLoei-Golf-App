import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import Popup from './Popup'; 

function PaymentManager() {
  const [activeLanes, setActiveLanes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // คลังไม้กอล์ฟหลักที่ดึงมาจากฐานข้อมูล Firebase
  const [clubInventory, setClubInventory] = useState([]);

  // Modal คิดเงินตามเลนซ้อมปกติ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // State สำหรับเปิด/ปิดหน้าต่างโมดอลสร้าง "บันทึกรายได้อื่นๆ"
  const [isOtherIncomeModalOpen, setIsOtherIncomeModalOpen] = useState(false);

  // ฟอร์มคิดเงินปกติ
  const [clubQty, setClubQty] = useState(1);
  const [ballQty, setBallQty] = useState(1);
  const [penalty, setPenalty] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('เงินสด');

  // ฟอร์มสำหรับ "บันทึกรายได้อื่นๆ"
  const [otherIncomeForm, setOtherIncomeForm] = useState({
    customerName: '',
    description: '',
    amount: '',
    method: 'เงินสด'
  });

  // State ตะกร้าเลือกประเภทไม้กอล์ฟแยกชิ้น สำหรับ "บันทึกรายได้อื่นๆ"
  const [manualClubCart, setManualClubCart] = useState([]);

  // State เก็บบล็อกเวลาที่พนักงานเลือกจิ้มในตารางรายได้อื่นๆ 
  const [manualSelectedSlots, setManualSelectedSlots] = useState({});

  // State ล็อก ID แถวขอยกเลิกชั่วคราวหน้าบ้าน เพื่อคุมสเตทปุ่มและเฉดสีเหลือง
  const [voidConfirmTargetId, setVoidConfirmTargetId] = useState(null);

  // State สำหรับจัดการ Custom Popup แจ้งเตือนสากล
  const [alertPopup, setAlertPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  const TOTAL_LANES = 15;
  const laneNumbers = Array.from({ length: TOTAL_LANES }, (_, i) => i + 1);

  const TIME_SLOTS = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00", "18:00-19:00"
  ];

  const CLUB_PRICE_RATE = 20;
  const BALL_PRICE_RATE = 30;
  const MANUAL_LANE_HOURLY_RATE = 100; 

  useEffect(() => {
    // 1. ดึงข้อมูลเลนที่กำลังใช้งานอยู่จริง
    const bookingsQuery = query(
      collection(db, 'bookings'), 
      where('status', '==', 'occupied') 
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveLanes(bookingsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings: ", error);
    });

    // 2. ดึงประวัติรายได้ล่าสุดจากคอลเลกชัน "payments"
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('Payment_Date', 'desc'),
      limit(10)
    );

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(paymentsList);
    }, (error) => {
      console.error("Error fetching payments history: ", error);
    });

    // 3. ดึงคลังชนิดประเภทไม้กอล์ฟหลักจาก Firebase
    const unsubscribeClubs = onSnapshot(collection(db, "golf_clubs"), (snapshot) => {
      const clubs = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().Club_Name || "ไม่มีชื่ออุปกรณ์",
        price: Number(d.data().price || 20)
      }));
      setClubInventory(clubs);
    });

    return () => {
      unsubscribeBookings();
      unsubscribePayments();
      unsubscribeClubs();
    };
  }, []);

  const handleOpenPayment = (booking) => {
    setSelectedBooking(booking);
    setClubQty(booking.needsClubRent ? 1 : 0);
    setBallQty(1);
    setPenalty(0);
    setUsedPoints(0);
    setPaymentMethod('เงินสด');
    setIsModalOpen(true);
  };

  // เปิดฟอร์มบันทึกรายได้อื่นๆ
  const handleOpenOtherIncome = () => {
    setOtherIncomeForm({
      customerName: '',
      description: '',
      amount: '',
      method: 'เงินสด'
    });
    setManualSelectedSlots({}); 
    setManualClubCart([]); 
    setIsOtherIncomeModalOpen(true);
  };

  const handleManualSlotClick = (laneNum, slot) => {
    const laneKey = `lane_${laneNum}`;
    const currentLaneSlots = manualSelectedSlots[laneKey] || [];

    if (currentLaneSlots.includes(slot)) {
      const updated = currentLaneSlots.filter(s => s !== slot);
      if (updated.length === 0) {
        const copy = { ...manualSelectedSlots };
        delete copy[laneKey];
        setManualSelectedSlots(copy);
      } else {
        setManualSelectedSlots({ ...manualSelectedSlots, [laneKey]: updated });
      }
    } else {
      setManualSelectedSlots({ ...manualSelectedSlots, [laneKey]: [...currentLaneSlots, slot] });
    }
  };

  const handleManualClubCartUpdate = (club, change) => {
    const existing = manualClubCart.find(item => item.id === club.id);
    if (existing) {
      const newQty = Math.max(0, existing.qty + change);
      if (newQty === 0) {
        setManualClubCart(manualClubCart.filter(item => item.id !== club.id));
      } else {
        setManualClubCart(manualClubCart.map(item => item.id === club.id ? { ...item, qty: newQty } : item));
      }
    } else if (change > 0) {
      setManualClubCart([...manualClubCart, { ...club, qty: 1 }]);
    }
  };

  const getManualClubCartTotalCost = () => {
    return manualClubCart.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };

  const getManualSelectedSlotsCount = () => {
    return Object.values(manualSelectedSlots).reduce((acc, curr) => acc + curr.length, 0);
  };

  const getManualSelectedLanesArray = () => {
    return Object.keys(manualSelectedSlots).map(key => parseInt(key.replace('lane_', ''))).sort((a,b)=>a-b);
  };

  const totalAmount = (clubQty * CLUB_PRICE_RATE) + (ballQty * BALL_PRICE_RATE) + Number(penalty);
  const pointDiscount = usedPoints; 
  const netAmount = totalAmount - pointDiscount < 0 ? 0 : totalAmount - pointDiscount;

  const handleConfirmPayment = async () => {
    try {
      await addDoc(collection(db, 'payments'), {
        Booking_ID: selectedBooking.id,
        User_ID: selectedBooking.User_ID || 'walk-in',
        FullName: selectedBooking.customerName || 'ลูกค้า Walk-in', 
        Payment_Date: serverTimestamp(),
        Total_Amount: totalAmount,
        Used_Points: usedPoints,
        Point_Discount: pointDiscount,
        Net_Amount: netAmount,
        Payment_Method: paymentMethod, 
        Lane_Code: selectedBooking.selectedLanes ? `เลน ${selectedBooking.selectedLanes.join(', ')}` : 'ไม่ระบุเลน',
        status: 'active',
        Items_List: [
          { item_name: 'ค่าเช่าไม้กอล์ฟ', qty: clubQty, price: clubQty * CLUB_PRICE_RATE },
          { item_name: 'จำนวนถาดลูกกอล์ฟ', qty: ballQty, price: ballQty * BALL_PRICE_RATE },
          { item_name: 'ค่าปรับ', qty: penalty > 0 ? 1 : 0, price: Number(penalty) }
        ]
      });

      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, {
        status: 'completed'
      });

      if (selectedBooking.selectedLanes && selectedBooking.selectedLanes.length > 0) {
        for (const laneNum of selectedBooking.selectedLanes) {
          const laneRef = doc(db, 'lanes', `lane_${laneNum}`);
          await updateDoc(laneRef, {
            status: 'available'
          });
        }
      }

      setIsModalOpen(false);
      
      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'ชำระเงินเสร็จสิ้น',
        message: `ระบบได้รับเงินยอดสุทธิ ${netAmount} บาท และสั่งเคลียร์เลนซ้อมคืนสถานะว่างเรียบร้อยครับ`,
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });

    } catch (error) {
      console.error("Firebase Update Error: ", error);
      setAlertPopup({
        isOpen: true,
        type: 'danger',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถรับชำระยอดเงินได้เนื่องจาก: ' + error.message,
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleConfirmOtherIncome = async () => {
    if (!otherIncomeForm.customerName.trim() || !otherIncomeForm.amount || Number(otherIncomeForm.amount) <= 0) {
      setAlertPopup({
        isOpen: true,
        type: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกชื่อลูกค้า และระบุจำนวนยอดเงินสุทธิให้ถูกต้องด้วยครับ',
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      const parsedAmount = Number(otherIncomeForm.amount);
      const selectedLanes = getManualSelectedLanesArray();
      
      const itemsList = [
        { 
          item_name: otherIncomeForm.description.trim() || 'รายได้เบ็ดเตล็ดหน้าร้าน', 
          qty: 1, 
          price: parsedAmount - getManualClubCartTotalCost() 
        }
      ];

      manualClubCart.forEach(clubItem => {
        itemsList.push({
          item_name: `ค่าเช่าอุปกรณ์: ${clubItem.name}`,
          qty: clubItem.qty,
          price: clubItem.qty * clubItem.price
        });
      });

      await addDoc(collection(db, 'payments'), {
        Booking_ID: 'manual_income_' + Date.now(),
        User_ID: 'walk-in',
        FullName: otherIncomeForm.customerName, 
        Payment_Date: serverTimestamp(),
        Total_Amount: parsedAmount,
        Used_Points: 0,
        Point_Discount: 0,
        Net_Amount: parsedAmount,
        Payment_Method: otherIncomeForm.method, 
        Lane_Code: selectedLanes.length > 0 ? `เลน ${selectedLanes.join(', ')}` : 'ไม่ระบุเลน',
        status: 'active',
        Items_List: itemsList
      });

      setIsOtherIncomeModalOpen(false);

      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'บันทึกรายได้สำเร็จ',
        message: `ระบบทำการบันทึกยอดเงินจากคุณ ${otherIncomeForm.customerName} จำนวน ${parsedAmount} บาท เรียบร้อยแล้ว`,
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });

    } catch (error) {
      console.error("Error saving manual income: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    }
  };

  const handleRequestVoidPayment = async (item) => {
    if (voidConfirmTargetId !== item.id) {
      setVoidConfirmTargetId(item.id);
      return;
    }

    setAlertPopup({
      isOpen: true,
      type: 'danger',
      title: 'ยืนยันยกเลิกบิลสำเร็จ',
      message: `คุณแน่ใจใช่หรือไม่ที่จะอนุมัติยกเลิกบิลของชำระเงินคุณ ${item.FullName || 'ลูกค้า'} ออกจากระบบอย่างถาวร?`,
      onConfirm: async () => {
        try {
          const paymentRef = doc(db, 'payments', item.id);
          await updateDoc(paymentRef, {
            status: 'cancelled' 
          });

          setVoidConfirmTargetId(null); 
          setAlertPopup({
            isOpen: true,
            type: 'info',
            title: 'ยกเลิกรายการเสร็จสิ้น',
            message: 'ระบบดำเนินการบันทึกสถานะตัดบิลและระงับสิทธิ์ถาวรเรียบร้อยครับ',
            onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
          });
        } catch (error) {
          console.error("Error voiding document: ", error);
          alert("เกิดข้อผิดพลาดหลังบ้าน: " + error.message);
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 font-sans text-slate-800 relative select-none">
      
      {/* หน้ากระดานหัวเรื่องหลัก */}
      <div className="border-b pb-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">ระบบจัดการและคิดเงินรายได้หน้าร้าน</h1>
        <button 
          onClick={handleOpenOtherIncome}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl shadow transition-all active:scale-95 text-sm"
        >
          บันทึกรายได้อื่นๆ
        </button>
      </div>

      {/* --- ส่วนที่ 1: รายการเลนซ้อมกอล์ฟที่กำลังใช้งานอยู่จริง --- */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-700 mb-4 text-sm text-left">เลนซ้อมที่เปิดบริการขณะนี้ (เช็ค Real-time จากคอลเลกชัน bookings)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activeLanes.length === 0 ? (
            <div className="col-span-full bg-slate-50 p-10 rounded-2xl text-center text-gray-400 font-bold border border-dashed">
              ไม่มีเลนสนามที่เปิดเล่นสดหรือใช้งานอยู่ ณ ขณะนี้
            </div>
          ) : (
            activeLanes.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex flex-col items-center hover:shadow-md transition-all">
                <div className="w-24 h-20 bg-slate-100 rounded-xl mb-2 border flex flex-col items-center justify-center p-2 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">ชื่อลูกค้า</p>
                  <p className="text-xs text-emerald-700 font-black truncate max-w-full">{booking.customerName || 'ไม่ระบุชื่อ'}</p>
                </div>
                <span className="text-sm font-black text-slate-800 mb-1">
                  เลนซ้อม: {booking.selectedLanes ? booking.selectedLanes.map(l => `เลน ${l}`).join(', ') : 'ไม่ระบุ'}
                </span>
                
                <div className="flex space-x-1 mb-3">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-black animate-pulse">
                    กำลังใช้งานซ้อม
                  </span>
                </div>

                <button 
                  onClick={() => handleOpenPayment(booking)}
                  className="w-full py-2 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow-sm transition-all active:scale-95"
                >
                  เรียกคิดเงินชำระบิล
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- ส่วนที่ 2: ตารางสรุปประวัติรายได้ล่าสุด --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-left">
        <div className="bg-slate-200 p-4 font-black text-slate-700 text-sm">ประวัติการปิดยอดชำระเงิน 10 รายการล่าสุด (Collection: payments)</div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-400 border-b pb-2 text-xs uppercase font-bold">
                <th className="py-2.5 pl-2">ชื่อลูกค้า</th>
                <th>ตำแหน่งเลน</th>
                <th>ยอดเงินรวม</th>
                <th>ส่วนลดแต้ม</th>
                <th>ชำระเงินสุทธิ</th>
                <th>วิธีชำระเงิน</th>
                <th className="text-right pr-4">การจัดการบิล</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
              {history.map((item) => {
                const isVoidPendingLocal = voidConfirmTargetId === item.id;
                const isCancelled = item.status === 'cancelled';
                
                let rowBgClass = 'border-b last:border-none hover:bg-slate-50 transition-colors';
                if (isVoidPendingLocal) {
                  rowBgClass = 'bg-amber-50 hover:bg-amber-100/70 transition-all border-b border-amber-200';
                } else if (isCancelled) {
                  rowBgClass = 'bg-slate-100 text-slate-400 line-through opacity-75 border-b border-slate-200';
                }

                return (
                  <tr key={item.id} className={rowBgClass}>
                    <td className={`py-3 font-bold pl-2 ${isCancelled ? 'text-slate-400' : 'text-slate-800'}`}>{item.FullName || 'ไม่ระบุชื่อ'}</td>
                    <td className="text-xs font-bold text-slate-500">{item.Lane_Code || 'ไม่ระบุเลน'}</td>
                    <td>{item.Total_Amount} บาท</td>
                    <td>{item.Point_Discount || 0} บาท</td>
                    <td className={`font-black ${isCancelled ? 'text-slate-400' : 'text-emerald-700'}`}>{item.Net_Amount} บาท</td>
                    <td>
                      <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold text-slate-500 border">{item.Payment_Method}</span>
                    </td>
                    <td className="py-2 text-right pr-2 whitespace-nowrap">
                      {isCancelled ? (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-lg border border-slate-300">
                          ยกเลิกบิลเรียบร้อย
                        </span>
                      ) : isVoidPendingLocal ? (
                        <button
                          onClick={() => handleRequestVoidPayment(item)}
                          className="text-[11px] font-black bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                          ยืนยันการยกเลิก
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequestVoidPayment(item)}
                          className="text-xs font-black px-3 py-1 rounded-lg border transition-all active:scale-95 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                        >
                          ยกเลิกรายการ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ส่วนที่ 3: หน้าต่างตรวจสอบโมดอลคำนวณราคาสรุปบิลตามเลนซ้อม --- */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full p-6 border-2 border-indigo-100 text-left">
            <h2 className="text-xl font-black text-slate-800 mb-1">ใบสรุปรายการและคิดเงินรับชำระ</h2>
            <p className="text-xs text-slate-400 mb-4">เชื่อมต่อฐานข้อมูลคำสั่งเอกสาร ID: {selectedBooking.id}</p>

            <div className="bg-slate-100 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 border">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อลูกค้า</label>
                <div className="w-full bg-white border rounded-xl px-3 py-2 text-sm font-bold text-slate-800 truncate">{selectedBooking.customerName || 'ไม่ระบุชื่อ'}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">เบอร์โทรติดต่อ</label>
                <div className="w-full bg-white border rounded-xl px-3 py-2 text-sm font-bold text-slate-800">{selectedBooking.customerPhone || '-'}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">หมายเลขเลน</label>
                <div className="w-full bg-white border rounded-xl px-3 py-2 text-sm font-black text-indigo-600">เลน {selectedBooking.selectedLanes?.join(', ')}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนผู้เข้าใช้</label>
                <div className="w-full bg-white border rounded-xl px-3 py-2 text-sm font-bold text-slate-800 text-center">{selectedBooking.guestCount || 1} ท่าน</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">ค่าเช่าไม้กอล์ฟพ่วงบิล</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setClubQty(Math.max(0, clubQty - 1))} className="bg-red-400 text-white w-6 h-6 rounded flex items-center justify-center font-bold shadow-sm">-</button>
                      <span className="w-6 text-center text-sm font-black">{clubQty}</span>
                      <button onClick={() => setClubQty(clubQty + 1)} className="bg-green-400 text-white w-6 h-6 rounded flex items-center justify-center font-bold shadow-sm">+</button>
                    </div>
                    <span className="w-20 text-right text-sm font-bold text-slate-600">{clubQty * CLUB_PRICE_RATE} ฿</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">จำนวนถาดลูกกอล์ฟที่ไดร์ฟ</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setBallQty(Math.max(0, ballQty - 1))} className="bg-red-400 text-white w-6 h-6 rounded flex items-center justify-center font-bold shadow-sm">-</button>
                      <span className="w-6 text-center text-sm font-black">{ballQty}</span>
                      <button onClick={() => setBallQty(ballQty + 1)} className="bg-green-400 text-white w-6 h-6 rounded font-bold shadow-sm">+</button>
                    </div>
                    <span className="w-20 text-right text-sm font-bold text-slate-600">{ballQty * BALL_PRICE_RATE} ฿</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">ค่าปรับความเสียหาย</span>
                  <button onClick={() => setPenalty(penalty === 0 ? 50 : 0)} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border ${penalty > 0 ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                    {penalty > 0 ? '✓ รวมค่าปรับของเสียหายแล้ว' : '+ เพิ่มค่าปรับทำของเสียหาย (50 บาท)'}
                  </button>
                  <span className="text-sm font-black text-red-500">{penalty} ฿</span>
                </div>

                <hr className="border-slate-200" />

                <div className="space-y-1.5 text-sm text-slate-700">
                  <div className="flex justify-between font-bold">
                    <span>ยอดรวมราคาทั้งสิ้น:</span>
                    <span>{totalAmount} บาท</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 items-center">
                    <span>ยอดแต้มสะสมสมาชิก: {selectedBooking.Points_Balance || 0} แต้ม</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-slate-500">ส่วนลดใช้แต้มสะสม:</span>
                      <input 
                        type="number"
                        value={usedPoints}
                        onChange={(e) => setUsedPoints(Math.max(0, Number(e.target.value)))}
                        className="w-16 border rounded-lg text-center font-bold py-0.5"
                      />
                      <span>แต้ม</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-black text-xl border-t pt-2 text-emerald-700">
                    <span>ยอดรวมชำระสุทธิ:</span>
                    <span>{netAmount} บาท</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-gray-700 font-bold py-2.5 rounded-xl text-center text-sm transition-all">
                    ย้อนกลับ
                  </button>
                  <button onClick={handleConfirmPayment} className="flex-1 bg-emerald-600 text-white font-black py-2.5 rounded-xl text-center hover:bg-emerald-700 shadow-md text-sm transition-all active:scale-95">
                    ยืนยันปิดยอดบิล & เคลียร์เลน
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <span className="text-sm font-black mb-3 block text-center text-slate-700">ช่องทางรับชำระเงิน</span>
                <div className="flex flex-col space-y-2">
                  {['เงินสด', 'เงินโอน', 'รวมทั้งสอง'].map((method) => (
                    <label key={method} className="flex items-center justify-between border bg-white rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 transition-all border-slate-200">
                      <span className="text-xs font-black text-slate-600">{method}</span>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="w-4 h-4 accent-emerald-700" 
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- ส่วนที่ 4: MODAL บันทึกรายได้อื่นๆ แบบดึงตารางผังเวลา + เลือกประเภทชนิดไม้กอล์ฟยืม --- */}
      {isOtherIncomeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-6xl bg-white p-6 rounded-[2.5rem] shadow-2xl border text-left flex flex-col max-h-[94vh] overflow-hidden">
            
            <div className="border-b pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">บันทึกรายได้เบ็ดเตล็ดหน้าร้าน (แบบเลือกผังเวลาและอุปกรณ์)</h3>
                <p className="text-xs text-slate-400 mt-0.5">ระบุชื่อ เลือกช่องเวลาตาราง และจัดแจงประเภทไม้กอล์ฟเพื่อคำนวณเงินสุทธิ</p>
              </div>
              <button onClick={() => setIsOtherIncomeModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            {/* เนื้อหาภายในโมดอล */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden flex-1 pr-1">
              
              {/* ผังกระดานตารางหมากรุกพิกัดเวลาเลนซ้อม 1-15 */}
              <div className="lg:col-span-3 border rounded-2xl p-4 bg-slate-50 overflow-auto h-full">
                <p className="text-xs font-black text-indigo-600 mb-3">คลิกจิ้มเลือกสล็อตเวลา (ปุ่มสีส้ม) เพื่อนำมาคิดคำนวณยอดบิล:</p>
                <table className="w-full min-w-[750px] border-collapse text-center text-xs">
                  <thead>
                    <tr className="bg-slate-200 border-b">
                      <th className="p-2.5 font-black text-slate-700 sticky left-0 bg-slate-300 z-10 w-20">เลนซ้อม</th>
                      {TIME_SLOTS.map(slot => (
                        <th key={slot} className="p-2 font-bold text-slate-600 border-r text-[10px]">{slot.split('-')[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {laneNumbers.map((laneNum) => {
                      const laneKey = `lane_${laneNum}`;
                      const currentLaneSlots = manualSelectedSlots[laneKey] || [];

                      return (
                        <tr key={laneNum} className="border-b border-slate-200 bg-white hover:bg-slate-50">
                          <td className="p-2 font-extrabold text-slate-700 bg-slate-100 sticky left-0 z-10 border-r shadow-xs">เลน {laneNum}</td>
                          {TIME_SLOTS.map(slot => {
                            const isSelecting = currentLaneSlots.includes(slot);
                            return (
                              <td
                                key={slot}
                                onClick={() => handleManualSlotClick(laneNum, slot)}
                                className={`p-2 border-r cursor-pointer font-bold select-none text-[11px] transition-all h-9 ${
                                  isSelecting 
                                    ? 'bg-amber-400 text-amber-950 border-2 border-amber-500 shadow-inner' 
                                    : 'text-transparent hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {isSelecting ? '✓' : ''}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ฝั่งขวา: ฟอร์มรายละเอียดข้อมูลจำนวนยอดเงินชำระบิลและการเลือกประเภทไม้ */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between h-full overflow-hidden">
                
                {/* พื้นที่กรอกข้อมูลด้านบนเปิดให้ Scroll อิสระภายใน */}
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อลูกค้า / รายรับ</label>
                    <input 
                      type="text" 
                      value={otherIncomeForm.customerName} 
                      onChange={(e) => setOtherIncomeForm({ ...otherIncomeForm, customerName: e.target.value })} 
                      placeholder="กรอกชื่อผู้จ่ายเงิน..." 
                      className="w-full bg-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">หมายเหตุชี้แจงเพิ่มเติม</label>
                    <textarea 
                      rows="2"
                      value={otherIncomeForm.description} 
                      onChange={(e) => setOtherIncomeForm({ ...otherIncomeForm, description: e.target.value })} 
                      placeholder="ระบุคำอธิบายสินค้า/บริการ..." 
                      className="w-full bg-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none resize-none" 
                    />
                  </div>

                  {/* Сรุปพิกัดเลนที่เลือกจิ้มตาราง */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs font-bold text-slate-600">
                    <p>สล็อตเวลาที่เลือก: <span className="text-indigo-600 font-black text-sm">{getManualSelectedSlotsCount()}</span> ช่อง</p>
                    <p className="mt-1 truncate">เลนซ้อม: {getManualSelectedLanesArray().length > 0 ? getManualSelectedLanesArray().map(l => `เลน ${l}`).join(', ') : 'ยังไม่ได้เลือก'}</p>
                  </div>

                  {/* ระบบเลือกประเภทไม้กอล์ฟ */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                    <span className="text-xs font-black text-slate-700 block">เลือกยืมประเภทประเภทไม้กอล์ฟ:</span>
                    <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                      {clubInventory.map(club => {
                        const cartItem = manualClubCart.find(i => i.id === club.id);
                        const currentQty = cartItem ? cartItem.qty : 0;

                        return (
                          <div key={club.id} className="flex justify-between items-center bg-white p-2 rounded-lg border text-[11px] font-bold shadow-2xs">
                            <span className="truncate max-w-[110px] text-slate-700">{club.name}</span>
                            <div className="flex items-center space-x-2">
                              <button 
                                type="button"
                                onClick={() => handleManualClubCartUpdate(club, -1)} 
                                className="bg-red-400 text-white w-5 h-5 rounded flex items-center justify-center font-black"
                              >
                                -
                              </button>
                              <span className="w-4 text-center text-xs text-slate-800">{currentQty}</span>
                              <button 
                                type="button"
                                onClick={() => handleManualClubCartUpdate(club, 1)} 
                                className="bg-green-400 text-white w-5 h-5 rounded flex items-center justify-center font-black"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1 border-t">
                      <span>รวมราคาค่าเช่าไม้เฉพาะกิจ:</span>
                      <span className="text-slate-700 font-black">{getManualClubCartTotalCost()} บาท</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนเงินที่เรียกเก็บชำระจริง (บาท)</label>
                    <input 
                      type="number" 
                      value={otherIncomeForm.amount} 
                      onChange={(e) => setOtherIncomeForm({ ...otherIncomeForm, amount: e.target.value })} 
                      placeholder="0.00" 
                      className="w-full bg-slate-100 p-3 rounded-xl text-base font-black focus:outline-none text-emerald-700 border" 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const timeAmount = getManualSelectedSlotsCount() * MANUAL_LANE_HOURLY_RATE;
                        const clubsAmount = getManualClubCartTotalCost();
                        setOtherIncomeForm({ ...otherIncomeForm, amount: timeAmount + clubsAmount });
                      }}
                      className="text-[11px] text-indigo-600 font-bold underline mt-1.5 block text-left"
                    >
                      * คำนวณราคาออโต้รวมสล็อตเวลา และคลังประเภทไม้เช่า
                    </button>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-1">ช่องทางชำระเงิน</p>
                    <div className="flex gap-2">
                      {['เงินสด', 'เงินโอน'].map((method) => (
                        <button 
                          key={method}
                          type="button"
                          onClick={() => setOtherIncomeForm({ ...otherIncomeForm, method })} 
                          className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${otherIncomeForm.method === method ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-xs' : 'bg-slate-50 text-slate-400'}`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ปุ่มปิดท้าย ล็อกตำแหน่งอยู่ด้านล่างอย่างมั่นคง */}
                <div className="flex gap-2 pt-4 border-t border-slate-200 bg-white">
                  <button 
                    type="button" 
                    onClick={() => setIsOtherIncomeModalOpen(false)} 
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs text-center transition-all active:scale-95"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmOtherIncome} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs text-center shadow transition-all active:scale-95"
                  >
                    บันทึกบิลสำเร็จ
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* หน้าต่าง Custom Popup แสดงกล่องข้อความเตือนของระบบ */}
      <Popup 
        isOpen={alertPopup.isOpen} 
        type={alertPopup.type} 
        title={alertPopup.title} 
        message={alertPopup.message} 
        onConfirm={alertPopup.onConfirm} 
        onCancel={() => setAlertPopup(prev => ({ ...prev, isOpen: false }))} 
      />

    </div>
  );
}

export default PaymentManager;