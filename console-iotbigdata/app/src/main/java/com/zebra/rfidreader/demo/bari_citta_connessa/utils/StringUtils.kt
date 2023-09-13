package com.zebra.rfidreader.demo.bari_citta_connessa.utils

import java.text.SimpleDateFormat
import java.util.*

fun formattedStringDate(date: String, withHour: Boolean): String {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val dateFormatWithHour = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    var convertedDate: Date? = null

    try {
        convertedDate = dateFormat.parse(date)
    } catch (e: Exception) {
    }
    try {
        convertedDate = dateFormatWithHour.parse(date)
    } catch (e: Exception) {
    }

    if (convertedDate == null) return "-"

    return try{
        val df = if (withHour){
            SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault())
        } else {
            SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        }
        df.format(convertedDate)
    } catch (e: Exception){
        "-"
    }

}

fun capitalize(string: String) : String {
    return string.toLowerCase().split(' ').joinToString(" ") { it.capitalize() }
}
