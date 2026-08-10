const appendDeliveryTimeline = (order, { status, note = "", photo = null }) => {
    if (!order.deliveryTimeline) {
        order.deliveryTimeline = [];
    }

    order.deliveryTimeline.push({
        status,
        note,
        photo,
        at: new Date()
    });
};

module.exports = {
    appendDeliveryTimeline
};
