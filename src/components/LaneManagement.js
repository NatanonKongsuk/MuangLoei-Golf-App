import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { db } from '../firebase'; // หรือ '../firebaseConfig' ตามพาทไฟล์ตั้งค่าของคุณ
import { collection, getDocs, setDoc, doc, updateDoc, query, where, Timestamp, deleteDoc, addDoc } from "firebase/firestore"; 
import { theme } from '../styles/theme';
import Popup from './Popup'; 
import BookingDetailModal from './BookingDetailModal'; // ดึง Component ย่อยที่เราสร้างแยกไว้เข้ามา

function LaneManagement() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  const [bookingsList, setBookingsList] = useState([]); 
  const [baseLanes, setBaseLanes] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [isShopClosed, setIsShopClosed] = useState(false); 

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); 
  const [currentBooking, setCurrentBooking] = useState(null);
  const [focusedCellInfo, setFocusedCellInfo] = useState(null); 

  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInGuests, setWalkInGuests] = useState('1');
  const [walkInInstructor, setWalkInInstructor] = useState(false);

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

  const getBorderColorById = (id) => {
    if (!id) return 'border-slate-400';
    if (id.startsWith('maintenance_')) return 'border-red-600'; 
    
    const colors = [
      'border-purple-600',    'border-blue-600',       'border-emerald-600', 
      'border-fuchsia-600',    'border-orange-500',    'border-indigo-700',    
      'border-pink-500',       'border-teal-600',      'border-lime-600',      
      'border-sky-600',        'border-rose-600',      'border-violet-600',    
      'border-amber-600',      'border-amber-950',     'border-red-700'
    ];

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const closureQuery = query(
        collection(db, "shop_closures"),
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp)
      );
      const closureSnapshot = await getDocs(closureQuery);

      if (!closureSnapshot.empty) {
        const closureData = closureSnapshot.docs[0].data();
        const reason = closureData.reason || "ปรับปรุงสนามประจำปี";
        setIsShopClosed(true);
        setBookingsList([]);
        setBaseLanes({});
        setLoading(false);

        setAlertPopup({
          isOpen: true,
          type: 'danger',
          title: 'สนามปิดให้บริการ',
          message: `วันที่เลือก (${selectedDate}) ตรงกับวันปิดร้านล่วงหน้าที่ระบบบันทึกไว้เนื่องจาก: ${reason}`,
          onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      setIsShopClosed(false);

      const laneSnapshot = await getDocs(collection(db, "lanes"));
      const lanesData = {};
      laneSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.laneNumber) {
          lanesData[data.laneNumber.toString()] = data;
        }
      });
      setBaseLanes(lanesData);

      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("bookingDate", "==", selectedDate));
      const bookingSnapshot = await getDocs(q);
      
      const tempBookings = bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookingsList(tempBookings);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    setSelectedSlots({}); 
  }, [selectedDate]);

  const getCellStatus = (laneNum, slot) => {
    if (isShopClosed) {
      return { status: 'maintenance', booking: { id: `shop_closed`, customerName: 'สนามปิดให้บริการล่วงหน้า', laneNum } };
    }

    if (baseLanes[laneNum.toString()]?.status === 'maintenance') {
      return { status: 'maintenance', booking: { id: `maintenance_total_${laneNum}`, customerName: 'ปิดปรับปรุงระบบ', laneNum } };
    }

    const matched = bookingsList.find(b => {
      const isStatusActive = b.status === 'pending' || b.status === 'confirmed' || b.status === 'occupied' || b.status === 'maintenance';
      const hasLane = b.selectedLanes && b.selectedLanes.includes(laneNum);
      const hasSlot = b.timeSlots && b.timeSlots.includes(slot);
      return isStatusActive && hasLane && hasSlot;
    });

    if (matched) {
      if (matched.status === 'maintenance') {
        return { status: 'maintenance', booking: { ...matched, laneNum } };
      }
      return {
        status: matched.status === 'occupied' ? 'occupied' : 'booked',
        booking: { ...matched, laneNum }
      };
    }

    return { status: 'available', booking: null };
  };

  // ฟังก์ชันตัวนับใบจองแยกตามสถานะใบ (ไม่นับเศษช่วงเวลาซ้ำซ้อน)
  const getBookingCountByStatus = (statusName) => {
    return bookingsList.filter(b => b.status === statusName).length;
  };

  const handleCellClick = (laneNum, slot) => {
    if (isShopClosed) {
      setAlertPopup({
        isOpen: true,
        type: 'warning',
        title: 'ระงับการจองคิว',
        message: 'ไม่สามารถทำรายการได้เนื่องจากสนามปิดให้บริการชั่วคราวในวันดังกล่าว',
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const cellInfo = getCellStatus(laneNum, slot);
    
    if (cellInfo.status !== 'available') {
      setFocusedCellInfo({ laneNumber: laneNum, slot: slot, status: cellInfo.status });
      setCurrentBooking(cellInfo.booking);
      setIsDetailModalOpen(true);
      return;
    }

    const laneKey = `lane_${laneNum}`;
    const currentLaneSlots = selectedSlots[laneKey] || [];

    if (currentLaneSlots.includes(slot)) {
      const updated = currentLaneSlots.filter(s => s !== slot);
      if (updated.length === 0) {
        const copy = { ...selectedSlots };
        delete copy[laneKey];
        setSelectedSlots(copy);
      } else {
        setSelectedSlots({ ...selectedSlots, [laneKey]: updated });
      }
    } else {
      setSelectedSlots({ ...selectedSlots, [laneKey]: [...currentLaneSlots, slot] });
    }
  };

  const getTotalSelectedSlotsCount = () => {
    return Object.values(selectedSlots).reduce((acc, curr) => acc + curr.length, 0);
  };

  const getSelectedLanesArray = () => {
    return Object.keys(selectedSlots).map(key => parseInt(key.replace('lane_', ''))).sort((a,b)=>a-b);
  };

  const handleSaveWalkInSubmission = async () => {
    if (isShopClosed) return;
    if (!walkInName.trim()) {
      setAlertPopup({
        isOpen: true,
        type: 'danger',
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกชื่อลูกค้า Walk-in ก่อนทำการบันทึกข้อมูลเข้าสนามซ้อม',
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      const lanesArray = getSelectedLanesArray();
      const allTimeSlots = Array.from(new Set(Object.values(selectedSlots).flat())).sort(); 

      const walkInBookingData = {
        bookingDate: selectedDate,
        timeSlots: allTimeSlots, 
        detailedSlots: selectedSlots,
        customerName: walkInName,
        customerPhone: walkInPhone || "",
        guestCount: Number(walkInGuests || 1),
        needsInstructor: walkInInstructor,
        needsClubRent: false, 
        selectedLanes: lanesArray,
        laneNumber: lanesArray.join(", "),
        status: 'occupied', 
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "bookings"), walkInBookingData);

      setIsWalkInModalOpen(false);
      setSelectedSlots({});
      
      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'เปิดบิล Walk-in สำเร็จ',
        message: `ทำรายการเปิดใช้งานเลน ${lanesArray.join(", ")} ในระบบเรียบร้อยแล้ว`,
        onConfirm: () => {
          setAlertPopup(prev => ({ ...prev, isOpen: false }));
          fetchData();
        }
      });
    } catch (error) {
      setAlertPopup({
        isOpen: true,
        type: 'danger',
        title: 'เกิดข้อผิดพลาด',
        message: error.message,
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleSaveMaintenanceSlots = async () => {
    if (isShopClosed) return;
    const lanesArray = getSelectedLanesArray();
    if (lanesArray.length === 0) return;

    try {
      for (const num of lanesArray) {
        const docId = `lane_${num}`;
        await setDoc(doc(db, "lanes", docId), {
          laneNumber: num,
          status: "maintenance" 
        });
      }

      setSelectedSlots({});

      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'ปิดปรับปรุงเลนสำเร็จ',
        message: `ระบบดำเนินการตั้งค่าปิดใช้งาน เลนที่ ${lanesArray.join(", ")} ทุกช่วงเวลาเสร็จสิ้น`,
        onConfirm: () => {
          setAlertPopup(prev => ({ ...prev, isOpen: false }));
          fetchData();
        }
      });
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleCheckInBooking = async () => {
    if (!currentBooking) return;
    try {
      await updateDoc(doc(db, "bookings", currentBooking.id), { status: 'occupied' });
      setIsDetailModalOpen(false);
      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'Check-in สำเร็จ',
        message: 'ยืนยันการเข้าใช้งานเลนซ้อมเรียบร้อยแล้ว',
        onConfirm: () => { setAlertPopup(prev => ({ ...prev, isOpen: false })); fetchData(); }
      });
    } catch (error) {
      setAlertPopup({ isOpen: true, type: 'danger', title: 'เกิดข้อผิดพลาด', message: error.message, onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false })) });
    }
  };

  const handleClearToAvailable = (actionType) => {
    let titleMsg = "ยืนยันการเปลี่ยนสถานะ";
    let confirmMsg = "คุณต้องการยกเลิกข้อมูลช่วงเวลานี้ให้กลับเป็น 'ว่าง' ใช่หรือไม่?";
    let popType = 'info';

    if (actionType === 'checkout') {
      titleMsg = "เช็คเอาต์อุปกรณ์";
      confirmMsg = "ยืนยันการเสร็จสิ้นการใช้งาน (เช็คเอาต์) คิวซ้อมช่วงเวลานี้ใช่หรือไม่?";
    }
    if (actionType === 'cancel') {
      titleMsg = "ยกเลิกรายการ";
      confirmMsg = "คุณต้องการยกเลิกข้อมูลรายการนี้ออกจากระบบใช่หรือไม่?";
      popType = 'danger';
    }
    if (actionType === 'open') {
      titleMsg = "เปิดใช้งานเลนปกติ";
      confirmMsg = "ต้องการเปิดใช้งานเลนซ้อมนี้ในสถานะปกติใช่หรือไม่?";
    }

    setAlertPopup({
      isOpen: true,
      type: popType,
      title: titleMsg,
      message: confirmMsg,
      onConfirm: async () => {
        try {
          if (actionType === 'open' && focusedCellInfo) {
            await setDoc(doc(db, "lanes", `lane_${focusedCellInfo.laneNumber}`), {
              laneNumber: focusedCellInfo.laneNumber,
              status: "available"
            });
          } else if (currentBooking) {
            const targetStatus = actionType === 'cancel' ? 'cancelled' : 'completed';
            
            if (currentBooking.id && currentBooking.id.startsWith('maintenance_total')) {
              await setDoc(doc(db, "lanes", `lane_${focusedCellInfo.laneNumber}`), {
                laneNumber: focusedCellInfo.laneNumber,
                status: "available"
              });
            } else {
              await updateDoc(doc(db, "bookings", currentBooking.id), { status: targetStatus });
            }
          }

          setIsDetailModalOpen(false);
          setAlertPopup({
            isOpen: true,
            type: 'info',
            title: 'อัปเดตสถานะสำเร็จ',
            message: 'ระบบทำการปรับปรุงข้อมูลประจำผังเลนกอล์ฟเสร็จสิ้น',
            onConfirm: () => { setAlertPopup(prev => ({ ...prev, isOpen: false })); fetchData(); }
          });
        } catch (error) {
          setAlertPopup({ isOpen: true, type: 'danger', title: 'เกิดข้อผิดพลาด', message: error.message, onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false })) });
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-left font-sans relative">
      
      {/* ส่วนหัวการจัดการและปฏิทินป้อนเข้า */}
      <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">กระดานควบคุมผังเวลาและเลนซ้อมกоล์ฟ</h2>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2.5 rounded-2xl w-full md:w-auto">
          <label className="text-xs font-black text-indigo-700 uppercase tracking-wider pl-1">เลือกวันที่ตรวจสอบ :</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-indigo-200 p-1.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* 💡 บล็อกสรุปใหม่: แสดงสถิติจำนวนใบจองและจำนวนบิลที่กำลังใช้บริการแบบนับรายคน (ไม่เอาเศษช่วงเวลาซ้ำซ้อน) */}
      <div className="bg-slate-100 p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-3xs">
        <div>
          <p className="text-xl font-black text-slate-700">สรุปข้อมูลลูกค้าหน้าร้าน</p>
          <p className="text-xs text-indigo-600 font-black mt-0.5">ประจำวันที่: {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex flex-wrap gap-4 font-bold text-sm">
          <div className="flex items-center gap-3 bg-white text-slate-700 border px-5 py-3 rounded-2xl shadow-xs">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">จองคิวออนไลน์ทั้งหมด</span>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-base font-black">
              {loading ? "..." : (getBookingCountByStatus('pending') + getBookingCountByStatus('confirmed'))} รายการ
            </span>
          </div>
          <div className="flex items-center gap-3 bg-white text-slate-700 border px-5 py-3 rounded-2xl shadow-xs">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">กำลังซ้อมหน้าร้านตอนนี้</span>
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-xl text-base font-black">
              {loading ? "..." : getBookingCountByStatus('occupied')} รายการ
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-black text-slate-400 tracking-widest animate-pulse">กำลังจัดระเบียบตารางพิกัดเวลา...</div>
      ) : (
        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-center">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-4 font-black text-slate-700 bg-slate-200 sticky left-0 z-10 w-28 border-r">เลนซ้อม</th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot} className="p-3 text-xs font-black text-slate-600 border-r min-w-[90px]">{slot}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laneNumbers.map((laneNum) => {
                const laneKey = `lane_${laneNum}`;
                const currentLaneSlots = selectedSlots[laneKey] || [];

                return (
                  <tr key={laneNum} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="p-3 font-extrabold text-slate-800 bg-slate-50 sticky left-0 z-10 border-r shadow-sm">เลน {laneNum}</td>
                    {TIME_SLOTS.map((slot, index) => {
                      const cell = getCellStatus(laneNum, slot);
                      const isSelecting = currentLaneSlots.includes(slot); 

                      let cellStyle = "bg-white hover:bg-slate-100 cursor-pointer text-transparent border border-slate-200";
                      let customBorders = ""; 

                      if (isSelecting) {
                        cellStyle = "bg-amber-400 text-amber-950 font-black border border-amber-500 shadow-inner animate-pulse"; 
                      } else if (cell.status === 'maintenance' || cell.status === 'booked' || cell.status === 'occupied') {
                        const prevSlot = index > 0 ? TIME_SLOTS[index - 1] : null;
                        const nextSlot = index < TIME_SLOTS.length - 1 ? TIME_SLOTS[index + 1] : null;

                        const prevCell = prevSlot ? getCellStatus(laneNum, prevSlot) : null;
                        const nextCell = nextSlot ? getCellStatus(laneNum, nextSlot) : null;

                        const isPrevSameBooking = prevCell && prevCell.booking && cell.booking && prevCell.booking.id === cell.booking.id && prevCell.status === cell.status && prevCell.booking.laneNum === cell.booking.laneNum;
                        const isNextSameBooking = nextCell && nextCell.booking && cell.booking && nextCell.booking.id === cell.booking.id && nextCell.status === cell.status && nextCell.booking.laneNum === cell.booking.laneNum;

                        const bColor = getBorderColorById(cell.booking?.id);
                        
                        let bgBase = 'bg-[#67e8f9]';
                        let textBase = 'text-cyan-950';
                        if (cell.status === 'maintenance') {
                          bgBase = isShopClosed ? 'bg-slate-200' : 'bg-rose-300';
                          textBase = isShopClosed ? 'text-slate-500' : 'text-rose-950';
                        } else if (cell.status === 'occupied') {
                          bgBase = 'bg-[#fde047]';
                          textBase = 'text-amber-950';
                        }
                        
                        customBorders = `border-4 ${bColor} ${bgBase} ${textBase} font-bold `;
                        
                        if (isPrevSameBooking) {
                          customBorders += " border-l-0 rounded-l-none pl-[18px] "; 
                        } else {
                          customBorders += " rounded-l-lg border-l-4 "; 
                        }

                        if (isNextSameBooking) {
                          customBorders += " border-r-0 rounded-r-none pr-[18px] "; 
                        } else {
                          customBorders += " rounded-r-lg border-r-4 "; 
                        }

                        cellStyle = `cursor-pointer ${customBorders}`;
                      }

                      return (
                        <td
                          key={slot}
                          onClick={() => handleCellClick(laneNum, slot)}
                          className={`p-3 text-xs transition-all select-none ${cellStyle}`}
                        >
                          {isShopClosed ? '✕' : cell.status === 'maintenance' ? '🔧' : cell.status === 'booked' ? '👤' : cell.status === 'occupied' ? '⛳' : isSelecting ? '✓' : ''}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* แถบปุ่มลอยสรุปยอดแอกชันบาร์ */}
      {getTotalSelectedSlotsCount() > 0 && !isShopClosed && (
        <div className="mt-6 border border-amber-500/30 rounded-xl p-5 bg-amber-50 flex flex-col sm:flex-row items-center justify-between shadow-md gap-4 animate-slideUp">
          <div className="text-left">
            <div className="text-sm md:text-base font-bold text-slate-700">
              เลือกทั้งหมด : <span className="text-amber-600 font-black text-xl">{getTotalSelectedSlotsCount()}</span> ช่องเวลา
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">
              ตำแหน่งเลนซ้อม: {getSelectedLanesArray().map(l => `เลน ${l}`).join(', ')}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setSelectedSlots({})} className="bg-white hover:bg-slate-100 border text-slate-600 font-bold px-4 py-2 rounded-xl text-sm transition-all">ล้างรายการ</button>
            <button onClick={handleSaveMaintenanceSlots} className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all shadow">🔧 ปิดซ่อมแซมทั้งเลน</button>
            <button 
              onClick={() => {
                setWalkInName(''); setWalkInPhone(''); setWalkInGuests('1'); setWalkInInstructor(false);
                setIsWalkInModalOpen(true); 
              }} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl text-sm transition-all shadow"
            >
              ดำเนินการเปิดบิล Walk-in →
            </button>
          </div>
        </div>
      )}

      {/* 🎞 MODAL: ฟอร์มรายละเอียดลูกค้า Walk-in */}
      {isWalkInModalOpen && !isShopClosed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-2xl border text-left">
            <h3 className="text-xl font-black text-slate-800 border-b pb-2 mb-4">📝 ฟอร์มรายละเอียดลูกค้า Walk-in</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อลูกค้า</label>
                <input type="text" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="กรอกชื่อเพื่อเปิดสิทธิ์ใช้งาน..." className="w-full bg-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input type="tel" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="กรอกเบอร์โทรศัพท์ (ถ้ามี)..." className="w-full bg-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนผู้เข้าใช้บริการ (ท่าน)</label>
                <input type="number" min="1" value={walkInGuests} onChange={(e) => setWalkInGuests(e.target.value)} className="w-full bg-slate-100 p-3 rounded-xl text-sm font-bold focus:outline-none" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">ต้องการผู้สอนกоล์ฟ (Pro) หรือไม่?</p>
                <div className="flex gap-2">
                  <button onClick={() => setWalkInInstructor(true)} className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${walkInInstructor ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white'}`}>ต้องการ</button>
                  <button onClick={() => setWalkInInstructor(false)} className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${!walkInInstructor ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-white'}`}>ไม่ต้องการ</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <button onClick={() => setIsWalkInModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm">ย้อนกลับ</button>
              <button onClick={handleSaveWalkInSubmission} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-sm shadow">ยืนยันและเปิดเลน</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎞 Component ย่อยสำหรับดูและแก้ไขรายละเอียดการจอง */}
      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        focusedCellInfo={focusedCellInfo}
        currentBooking={currentBooking}
        isShopClosed={isShopClosed}
        onCheckIn={handleCheckInBooking}
        onClearToAvailable={handleClearToAvailable}
        onUpdateBooking={async (bookingId, updatedData) => {
          try {
            await updateDoc(doc(db, "bookings", bookingId), updatedData);
            setIsDetailModalOpen(false);
            fetchData(); // สั่งให้ตารางหลักโหลดข้อมูลสดใหม่มาวาดใหม่
          } catch(err) { 
            console.error(err); 
            alert("เกิดข้อผิดพลาดขณะอัปเดตข้อมูล: " + err.message);
          }
        }}
        /* ส่งพรอพ onDeleteBooking เข้าไปทำงานร่วมกับโครงสร้างสัญญาลบข้อมูลหลังบ้านอย่างปลอดภัย */
        onDeleteBooking={async (bookingId) => {
          try {
            await deleteDoc(doc(db, "bookings", bookingId));
            setIsDetailModalOpen(false);
            setAlertPopup({
              isOpen: true,
              type: 'info',
              title: 'ลบข้อมูลสำเร็จ',
              message: 'ระบบทำการลบข้อมูลรายการจองนี้ออกจากระบบอย่างถาวรเรียบร้อยแล้ว',
              onConfirm: () => { setAlertPopup(prev => ({ ...prev, isOpen: false })); fetchData(); }
            });
          } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดขณะลบข้อมูล: " + err.message);
          }
        }}
      />

      {/* บล็อก Alert Popup แจ้งเตือนทั่วไปของคุณ */}
      <Popup 
        isOpen={alertPopup.isOpen} 
        type={alertPopup.type} 
        title={alertPopup.title} 
        message={alertPopup.message} 
        onConfirm={alertPopup.onConfirm} 
        onCancel={() => setAlertPopup(prev => ({ ...prev, isOpen: false }))} 
      />
=======
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

function LaneManagement() {
  const [lanes, setLanes] = useState([]);

  // 1. ดึงข้อมูลสถานะเลนทั้งหมด
  const fetchLanes = async () => {
    const querySnapshot = await getDocs(collection(db, "lanes"));
    const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    // เรียงลำดับตามเลขเลน
    setLanes(data.sort((a, b) => a.laneNumber - b.laneNumber));
  };

  useEffect(() => {
    fetchLanes();
  }, []);

  // 2. ฟังก์ชันเปิด/ปิดเลน (Check-in / Check-out)
  const toggleLaneStatus = async (lane) => {
    const newStatus = lane.status === "available" ? "occupied" : "available";
    const laneRef = doc(db, "lanes", lane.id);
    
    try {
      await updateDoc(laneRef, { 
        status: newStatus,
        // ถ้าเปิดเลนให้ใส่ชื่อลูกค้าสมมติ (ในระบบจริงจะดึงจากหน้าจอง)
        customerName: newStatus === "occupied" ? "ลูกค้าทั่วไป" : "" 
      });
      fetchLanes(); // อัปเดตหน้าจอ
    } catch (error) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + error.message);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-green-800">ผังเลนซ้อม - Muang Loei Golf</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded"></span> ว่าง</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded"></span> กำลังใช้งาน</div>
        </div>
      </div>

      {/* แสดงเลนในรูปแบบ Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {lanes.map((lane) => (
          <div 
            key={lane.id}
            onClick={() => toggleLaneStatus(lane)}
            className={`cursor-pointer p-6 rounded-2xl shadow-md border-t-8 transition-all hover:scale-105 ${
              lane.status === "available" ? "bg-white border-green-500" : "bg-red-50 border-red-500"
            }`}
          >
            <div className="text-center">
              <span className="text-gray-500 text-sm font-semibold uppercase">Lane</span>
              <p className="text-4xl font-black text-gray-800">{lane.laneNumber}</p>
              <p className={`mt-2 font-bold ${lane.status === "available" ? "text-green-600" : "text-red-600"}`}>
                {lane.status === "available" ? "ว่าง" : "กำลังใช้งาน"}
              </p>
              {lane.customerName && <p className="text-xs text-gray-500 mt-1">{lane.customerName}</p>}
            </div>
          </div>
        ))}
      </div>
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
    </div>
  );
}

export default LaneManagement;