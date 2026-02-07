import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const CancelRequestModal = ({ isOpen, request, onConfirm, onCancel }) => {
    if (!isOpen || !request) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-vin-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-none max-w-md w-full p-10 border border-gray-200 shadow-2xl relative overflow-hidden animate-fade-in-up">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-vin-red"></div>

                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-vin-red/10 rounded-none mb-6">
                    <AlertTriangle className="w-8 h-8 text-vin-red" />
                </div>

                <h3 className="text-xl font-bold text-center text-vin-blue mb-4 uppercase tracking-tight">
                    Xác nhận hủy yêu cầu #{request.id}?
                </h3>

                <p className="text-sm text-center text-gray-500 mb-10 font-medium leading-relaxed">
                    {!request.parent_id
                        ? "Đây là yêu cầu gốc. Hành động này sẽ hủy tất cả các yêu cầu phụ liên quan đến yêu cầu này."
                        : "Bạn đang thực hiện hủy bỏ một yêu cầu phụ."
                    }
                </p>

                <div className="flex flex-col space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-white bg-vin-red hover:bg-[#a51b20] transition-all shadow-md active:translate-y-0.5"
                    >
                        Xác nhận Hủy bỏ
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 bg-transparent border border-gray-200 hover:bg-gray-50 transition-all font-medium"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CancelRequestModal;
