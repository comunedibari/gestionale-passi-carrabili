package com.zebra.rfidreader.demo.bari_citta_connessa.utils


import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Matrix

class Utils {

    companion object {
        fun dpToPx(dp: Int): Int {
            return (dp * Resources.getSystem().displayMetrics.density).toInt()
        }

        fun getScaledDownBitmap(bitmap: Bitmap, threshold: Int, isNecessaryToKeepOrig: Boolean): Bitmap {
            val width = bitmap.width
            val height = bitmap.height
            var newWidth = width
            var newHeight = height

            if (width > height && width > threshold) {
                newWidth = threshold
                newHeight = (height * newWidth.toFloat() / width).toInt()
            }

            if (width in (height + 1)..threshold) {
                //the bitmap is already smaller than our required dimension, no need to resize it
                return bitmap
            }

            if (width < height && height > threshold) {
                newHeight = threshold
                newWidth = (width * newHeight.toFloat() / height).toInt()
            }

            if (height in (width + 1)..threshold) {
                //the bitmap is already smaller than our required dimension, no need to resize it
                return bitmap
            }

            if (width == height && width > threshold) {
                newWidth = threshold
                newHeight = newWidth
            }

            return if (width == height && width <= threshold) {
                //the bitmap is already smaller than our required dimension, no need to resize it
                bitmap
            } else {
                getResizedBitmap(bitmap, newWidth, newHeight, isNecessaryToKeepOrig)
            }

        }

        fun getResizedBitmap(bm: Bitmap, newWidth: Int, newHeight: Int, isNecessaryToKeepOrig: Boolean): Bitmap {
            val width = bm.width
            val height = bm.height
            val scaleWidth = newWidth.toFloat() / width
            val scaleHeight = newHeight.toFloat() / height
            // CREATE A MATRIX FOR THE MANIPULATION
            val matrix = Matrix()
            // RESIZE THE BIT MAP
            matrix.postScale(scaleWidth, scaleHeight)

            // "RECREATE" THE NEW BITMAP
            val resizedBitmap = Bitmap.createBitmap(bm, 0, 0, width, height, matrix, false)
            if (!isNecessaryToKeepOrig) {
                bm.recycle()
            }
            return resizedBitmap
        }
    }
}

fun createAddress(address: String?, civico: String?, esponente: String?): String {
    val civicoResult = if (!civico.isNullOrBlank()) " $civico" else ""
    val esponenteResult = if (!civico.isNullOrBlank() && !esponente.isNullOrBlank()) "/$esponente" else ""
    return address + civicoResult + esponenteResult
}

fun statoPraticaPassiCarrabili(value: Int): String {
    return when (value) {
        0 -> "Bozza"
        1 -> "Inserita"
        2 -> "Verifica formale"
        3 -> "Richiesta pareri"
        4 -> "Necessaria integrazione"
        5 -> "Pratica da rigettare"
        6 -> "Approvata"
        7 -> "Preavviso diniego"
        8 -> "Attesa di pagamento"
        9 -> "Pronto al rilascio"
        10 -> "Concessione valida"
        11 -> "Pronto alla restituzione"
        12 -> "Richiesta lavori"
        13 -> "Attesa fine lavori"
        14 -> "Pratica da revocare"
        15 -> "Regolarizzazione"
        18 -> "Archiviata"
        19 -> "Revocata"
        else -> "Rigettata"
    }
}