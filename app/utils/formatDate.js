const formatDate = (date) => {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    min = d.getMinutes();
    hours = d.getHours();


    if (month.length < 2)
        month = "0" + month;
    if (day.length < 2)
        month = "0" + day;

    return [day, month, year + " " + min, hours].join("-", ":");
}
module.exports = formatDate