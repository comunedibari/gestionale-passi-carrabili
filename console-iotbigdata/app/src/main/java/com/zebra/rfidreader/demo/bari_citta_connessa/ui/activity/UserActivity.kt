package com.zebra.rfidreader.demo.bari_citta_connessa.ui.activity

import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProviders
import com.google.android.material.snackbar.Snackbar
import com.zebra.rfidreader.demo.bari_citta_connessa.data.UserLogged
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.formattedStringDate
import com.zebra.rfidreader.demo.databinding.UserBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview


@FlowPreview
@ExperimentalCoroutinesApi
@AndroidEntryPoint
class UserActivity : AppCompatActivity() {

    lateinit var binding: UserBinding

    private var utilViewModel: UtilViewModel? = null


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        utilViewModel = ViewModelProviders.of(this).get(UtilViewModel::class.java)
        utilViewModel?.userLogged = intent.getSerializableExtra("USERLOGGED") as UserLogged
        binding = UserBinding.inflate(layoutInflater)
        setContentView(binding.root)

        with (binding) {
            setSupportActionBar(toolbarSearch)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)

            utenzaValue.text = utilViewModel?.userLogged?.email ?: "-"
            cfValue.text = utilViewModel?.userLogged?.codicefiscale ?: "-"
            nomeValue.text = utilViewModel?.userLogged?.nome ?: "-"
            cognomeValue.text = utilViewModel?.userLogged?.cognome ?: "-"
            dataNascitaValue.text = formattedStringDate(utilViewModel?.userLogged?.datadinascita ?: "", false)
            luogoNascitaValue.text = utilViewModel?.userLogged?.luogodinascita ?: "-"
            provinciaNascitaValue.text = utilViewModel?.userLogged?.provinciadinascita ?: "-"
            telefonoValue.text = utilViewModel?.userLogged?.numtel ?: "-"
        }
    }


    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            android.R.id.home -> {
                finish()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean = true
}
