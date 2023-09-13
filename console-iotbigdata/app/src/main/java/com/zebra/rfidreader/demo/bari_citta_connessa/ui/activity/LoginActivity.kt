package com.zebra.rfidreader.demo.bari_citta_connessa.ui.activity

import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.util.DisplayMetrics
import android.view.View
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.google.android.material.snackbar.Snackbar
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.LoginViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.ViewModelFactory
import com.zebra.rfidreader.demo.databinding.ActivityLoginBinding
import com.zebra.rfidreader.demo.zebra.home.MainActivity

class LoginActivity : AppCompatActivity(), LoadingObserver, ErrorOwner {

    private var utilViewModel: UtilViewModel? = null

    private val viewModel: LoginViewModel by lazy { ViewModelProviders.of(this, ViewModelFactory).get(LoginViewModel::class.java) }

    private var context: Context = this
    private var loadingObserverListener: LoadingObserver? = null
    private var errorOwnerListener: ErrorOwner? = null
    private lateinit var snackbar: Snackbar


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        utilViewModel = ViewModelProviders.of(this).get(UtilViewModel::class.java)

        //val orientation = resources.configuration.orientation
        val displayMetrics: DisplayMetrics = resources.displayMetrics
        val dpWidth = displayMetrics.widthPixels / displayMetrics.density
        requestedOrientation = if (dpWidth < 800) {
            //ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE //TODO forzato in landscape
        } else {
            ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }

        utilViewModel?.loadingState?.observe(this, Observer {
                if (it.isPending()) {
                    it.complete()
                    if (it.value) {
                        findViewById<View>(R.id.loading).visibility = View.VISIBLE
                    } else {
                        findViewById<View>(R.id.loading).visibility = View.GONE
                    }
                }
        })

        val loginActivityBinding: ActivityLoginBinding = DataBindingUtil.setContentView(this, R.layout.activity_login)
        loginActivityBinding.viewModel = viewModel
        title = "Accedi"

        with(loginActivityBinding) {
            setSupportActionBar(toolbarLogin)

            loginButtonEnter.setOnClickListener(onEnterLogin)

            viewModel?.validForm()?.observe(this@LoginActivity, Observer {
                val isEnable: Boolean = it ?: false
                loginButtonEnter.isEnabled = isEnable
            })
        }
    }

    override fun onResume() {
        super.onResume()
        loadingObserverListener = this
        errorOwnerListener = this
    }

    override fun onDestroy() {
        super.onDestroy()
        loadingObserverListener = null
        errorOwnerListener = null
    }


    private var onEnterLogin = View.OnClickListener {

        viewModel.login().observeOwner(this, Observer { loginResponse ->
            if (loginResponse?.status == 200) {
                if (loginResponse.value?.auth != false && loginResponse.value?.userlogged != null) {

                    val goMapActivity = Intent(context, MainActivity::class.java)
                    goMapActivity.putExtra("USERLOGGED", loginResponse.value.userlogged)
                    startActivity(goMapActivity)
                    finish()
                } else {
                    snackbar = Snackbar.make(findViewById(android.R.id.content), "Utente non trovato", Snackbar.LENGTH_LONG)
                    snackbar.show()
                }

            } else {
                snackbar = Snackbar.make(findViewById(android.R.id.content), "Errore di connessione", Snackbar.LENGTH_LONG)
                snackbar.show()
            }
        })
    }

    @UiThread
    override fun enableLoading() {
        utilViewModel?.loading?.postValue(true)
    }

    @UiThread
    override fun disableLoading() {
        utilViewModel?.loading?.postValue(false)
    }

    @UiThread
    override fun onError(message: String) {
        snackbar = Snackbar.make(findViewById(android.R.id.content), "Errore di connessione", Snackbar.LENGTH_LONG)
        snackbar.show()
    }
}
