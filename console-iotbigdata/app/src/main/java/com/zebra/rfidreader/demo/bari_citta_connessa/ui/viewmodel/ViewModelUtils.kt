package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

@Suppress("UNCHECKED_CAST")
object ViewModelFactory : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(LoginViewModel::class.java) -> LoginViewModel() as T
            modelClass.isAssignableFrom(DialogReportingViewModel::class.java) -> DialogReportingViewModel() as T
            modelClass.isAssignableFrom(UtilViewModel::class.java) -> UtilViewModel() as T
            modelClass.isAssignableFrom(CivilarioViewModel::class.java) -> CivilarioViewModel() as T

            else -> throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}