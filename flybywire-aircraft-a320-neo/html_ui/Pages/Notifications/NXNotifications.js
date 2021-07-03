// Override as there is no reliable way to set url params
g_notification.CanShowNotification = () => {
    return true;
};

window.addEventListener('storage', event => {
    if (event.key = "notification") {
        if (event.newValue) {
            const message = JSON.parse(event.newValue);

            const notif = new NotificationData();
            notif.title = message.title;
            notif.id = message.id;
            notif.type = message.type;
            notif.theme = message.theme;
            notif.image = message.image;
            notif.description = message.message;
            notif.timeout = message.timeout;

            Coherent.trigger("SendNewNotification", notif);
            setTimeout(()=> {
                Coherent.trigger("HideNotification", notif.type, notif.id);
            }, notif.timeout);
        }
    }
});

window.onload = () => {
    const notification_border_box = document.createElement("div");
    notification_border_box.classList.add("notifications");
    notification_border_box.classList.add("border-box");

    const notification_area_center = document.createElement("div");
    notification_area_center.classList.add("notification-area");
    notification_area_center.id = "center";

    notification_border_box.appendChild(notification_area_center);

    const notification_popup = document.createElement("notification-popup");
    notification_popup.classList.add("hide");
    notification_popup.id = "popup";

    notification_area_center.appendChild(notification_popup);

    const notification_message = document.createElement("notification-message");
    notification_message.classList.add("hide");
    notification_message.id = "message";

    notification_border_box.appendChild(notification_message);

    const notification_gameplay = document.createElement("notification-gameplay");
    notification_gameplay.classList.add("hide");
    notification_gameplay.id = "gameplay";

    notification_border_box.appendChild(notification_gameplay);

    const notification_tips = document.createElement("notification-tips");
    notification_tips.classList.add("hide");
    notification_tips.id = "tips";

    notification_border_box.appendChild(notification_tips);

    const notification_area_bottom = document.createElement("div");
    notification_area_bottom.classList.add("notification-area");
    notification_area_bottom.id = "bottom";

    notification_border_box.appendChild(notification_area_bottom);

    const notification_subtitle = document.createElement("notification-subtitle");
    notification_subtitle.classList.add("hide");
    notification_subtitle.id = "subtitle";

    notification_area_bottom.appendChild(notification_subtitle);

    const notification_tooltip = document.createElement("notification-tooltip");
    notification_tooltip.classList.add("hide");
    notification_tooltip.id = "tooltip";

    notification_border_box.appendChild(notification_tooltip);

    const notification_objective = document.createElement("notification-objective");
    notification_objective.classList.add("hide");
    notification_objective.id = "objective";

    notification_border_box.appendChild(notification_objective);

    document.body.appendChild(notification_border_box);
};
