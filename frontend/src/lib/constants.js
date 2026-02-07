export const REQUEST_TYPES = [
    "Sử dụng CSVC",
    "Mở cửa phòng",
    "Sửa chữa thiết bị",
    "Vệ sinh",
    "An ninh",
    "Khác"
];

export const AUTO_FORWARD_TYPES = [
    "Sử dụng CSVC",
    "Mở cửa phòng"
];

export const REQUEST_STATUS = {
    PENDING: "pending",   // Waiting for Intermediary
    ASSIGNED: "assigned", // Forwarded to Tech
    COMPLETED: "completed",
    REJECTED: "rejected",
    CANCELLATION_REQUESTED: "cancellation_requested"
};
