package com.zebra.rfidreader.demo.bari_citta_connessa.ui.activity

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.activity.viewModels
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.Observer
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.CivilarioAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.SearchAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.CivilarioViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.SearchViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Event
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.EventObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.createAddress
import com.zebra.rfidreader.demo.databinding.ActivitySearchConcessionsBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.*


@FlowPreview
@ExperimentalCoroutinesApi
@AndroidEntryPoint
class SearchConcessionsActivity : AppCompatActivity(), LoadingObserver /*, ErrorOwner*/ {

    lateinit var binding: ActivitySearchConcessionsBinding

    private lateinit var searchAdapter: SearchAdapter
    private val searchViewModel: SearchViewModel by viewModels()
    private val civilarioViewModel: CivilarioViewModel by viewModels()

    private val utilViewModel: UtilViewModel by viewModels()


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_search_concessions)
        binding.viewModel = searchViewModel

        with(binding) {
            setSupportActionBar(toolbarSearch)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)

            addSearchList()


            searchButton.setOnClickListener {
                closeKeyBoard()
                CoroutineScope(Dispatchers.Main).launch {
                    if (determineTextNumber.text.toString().isNotEmpty() || tagTextNumber.text.toString().isNotEmpty() || addressText.text.toString().isNotEmpty()) {
                        searchViewModel.search(
                            SearchPraticheRequest(id_determina = determineTextNumber.text.toString(), tag_rfid = tagTextNumber.text.toString(), indirizzo = createAddress( addressText.text.toString(), civicoText.text.toString(), esponenteText.text.toString()))
                        ).observe(this@SearchConcessionsActivity, Observer {
                            it.value?.let { searchPraticheResponse ->
                                if (searchPraticheResponse.data?.size!! > 0) {
                                    searchViewModel.searchResult.postValue(ValidResult(searchPraticheResponse.data))
                                } else {
                                    searchViewModel.searchResult.postValue(EmptyResult(searchPraticheResponse.data))
                                }
                            }
                        })
                    } else {
                        searchViewModel.searchResult.postValue(EmptyQuery)
                    }
                }
            }

            searchViewModel.searchResult.observe(this@SearchConcessionsActivity, Observer {
                handleSearchResult(it)
            })

            addressSearchButton.setOnClickListener {
                if (addressText.text.toString() != "") {

                    val im = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                    im.hideSoftInputFromWindow(currentFocus?.windowToken, 0)
                    binding.viewModel?.checkAddress( addressText.text.toString(), civicoText.text.toString(), esponenteText.text.toString())?.observe(this@SearchConcessionsActivity, Observer { coj ->
                        coj?.value?.let { obj ->
                            val civilarioAdapter = CivilarioAdapter(obj.result) {
                                civilarioViewModel.objCivilario.postValue(Event(it))
                            }
                            searchAddressList.layoutManager = LinearLayoutManager(this@SearchConcessionsActivity)
                            searchAddressList.adapter = civilarioAdapter
                            civilarioAdapter.notifyDataSetChanged()
                            if (obj.result.size != 0) {
                                searchAddressList.visibility = View.VISIBLE
                            } else searchAddressList.visibility = View.GONE
                        }
                    })
                } else searchAddressList.visibility = View.GONE
            }

            civilarioViewModel.objCivilario.observe(this@SearchConcessionsActivity, EventObserver { coj ->
                addressText.setText(coj.nome_via)
                civicoText.setText(coj.numero.toString())
                esponenteText.setText(coj.esponente)
            })
        }
    }

    private fun handleSearchResult(it: SearchResult) {
        with(binding) {
            when (it) {
                is ValidResult -> {
                    emptyStateLayout.root.visibility = View.GONE
                    searchResultRecycler.visibility = View.VISIBLE
                    searchAdapter.updateDataList(it.result, false)
                }
                is ErrorResult,
                is EmptyResult -> {
                    emptyStateLayout.root.visibility = View.VISIBLE
                    searchResultRecycler.visibility = View.GONE
                    searchAdapter.updateDataList(emptyList(), true)
                }
                else -> {
                    Snackbar.make(binding.root, "E' necessario inserire almeno un parametro di ricerca", Snackbar.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun closeKeyBoard() {
        binding.searchRoot.clearFocus()
        val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputMethodManager.hideSoftInputFromWindow(binding.root.windowToken, 0)
    }

    private fun addSearchList() {
        with(binding) {
            searchResultRecycler.apply {
                isNestedScrollingEnabled = false
                layoutManager = LinearLayoutManager(this.context, LinearLayoutManager.VERTICAL, false)

                adapter = SearchAdapter(onItemClickListener = { _, item ->
                    val intent = Intent()
                    intent.putExtra("ITEM", item)
                    setResult(Activity.RESULT_OK, intent)
                    finish()

                }).also {
                    searchAdapter = it
                }
            }
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


    @UiThread
    override fun enableLoading() {
        utilViewModel.loading.postValue(true)
    }

    @UiThread
    override fun disableLoading() {
        utilViewModel.loading.postValue(false)
    }

}
