package com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.Address
import android.location.Location
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.util.Base64
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.annotation.UiThread
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.databinding.DataBindingUtil
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.google.android.gms.maps.model.LatLng
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.GeocoderTaskListener
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.MapDialogFragment
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.CivilarioViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.DialogReportingViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.ViewModelFactory
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.*
import com.zebra.rfidreader.demo.databinding.ReportingDialogFragmentBinding
import core_kt.utils.TAG
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class ReportingFragment : DialogFragment(), GeocoderTaskListener, LoadingObserver, ErrorOwner {

    private val utilViewModel: UtilViewModel? by lazy { activity?.let { ViewModelProviders.of(it, ViewModelFactory).get(UtilViewModel::class.java) } }
    private val civilarioViewModel: CivilarioViewModel? by lazy { activity?.let { ViewModelProviders.of(it, ViewModelFactory).get(CivilarioViewModel::class.java) } }
    private val viewModelReporting: DialogReportingViewModel by lazy { ViewModelProviders.of(this, ViewModelFactory).get(DialogReportingViewModel::class.java) }

    private lateinit var mapFrag: MapDialogFragment
    private var currentLocation: Location? = null
    private lateinit var binding: ReportingDialogFragmentBinding

    private var assetDetail: AssetDetail? = null
    private var reason: String? = null

    private var mCurrentPhotoPath: String = ""
    private var photoURI: Uri? = null
    private var imagePhotos: MutableList<Bitmap> = mutableListOf()

    override fun onResume() {
        dialog?.window?.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)
        if (assetDetail != null) {
            mapFrag.retrieveAndDrawMyPositionOnMap(
                LatLng(
                    viewModelReporting.tempIndirizzoCivilario?.location?.lat ?: 45.465454,
                    viewModelReporting.tempIndirizzoCivilario?.location?.lon ?: 9.186516
                )
            )
        }
        super.onResume()
    }

    override fun onDestroyView() {
        viewModelReporting.tempIndirizzoCivilario = null
        super.onDestroyView()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NO_TITLE, 0)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        binding = DataBindingUtil.inflate(inflater, R.layout.reporting_dialog_fragment, container, false)
        currentLocation = arguments?.getParcelable(LOCATION)
        assetDetail = arguments?.getSerializable(ASSET_DETAIL) as AssetDetail?
        reason = arguments?.getString(ASSET_REASON)
        mapFrag = MapDialogFragment()
        childFragmentManager.beginTransaction().add(R.id.map_reporting, mapFrag, TAG_FRAGMENT_DIALOG_MAP).commit()

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        with(binding) {
            if (assetDetail != null) {
                viewModelReporting.tempIndirizzoCivilario = assetDetail?.dati_istanza?.indirizzo_segnale_indicatore
                addressValue.text = viewModelReporting.tempIndirizzoCivilario?.indirizzo
                mapFrag.retrieveAndDrawMyPositionOnMap(
                    LatLng(
                        viewModelReporting.tempIndirizzoCivilario?.location?.lat ?: 45.465454,
                        viewModelReporting.tempIndirizzoCivilario?.location?.lon ?: 9.186516
                    )
                )
                nomeEditText.setText(capitalize(assetDetail?.anagrafica?.nome ?: ""))
                cognomeEditText.setText(capitalize(assetDetail?.anagrafica?.cognome ?: ""))
                emailEditText.setText(assetDetail?.anagrafica?.email ?: "")
                telefonoEditText.setText(assetDetail?.anagrafica?.recapito_telefonico ?: "")
                tagidEditText.setText(assetDetail?.tag_rfid ?: "")
                reportEditText.setText(reason ?: "")
                ragioneSocialeEditText.setText(assetDetail?.anagrafica?.ragione_sociale ?: "")
                addressValue.setCompoundDrawablesWithIntrinsicBounds(0, 0, 0, 0)
                nomeEditText.isEnabled = false
                cognomeEditText.isEnabled = false
                emailEditText.isEnabled = false
                telefonoEditText.isEnabled = false
                tagidEditText.isEnabled = false
                ragioneSocialeEditText.isEnabled = false
                confirmButton.isEnabled = !addressValue.text.isNullOrBlank() && !reportEditText.text.isNullOrBlank()
            }


            closeReporting.setOnClickListener {
                dismiss()
            }
            cancelButton.setOnClickListener {
                dismiss()
            }

            addressValue.setOnClickListener {
                if (assetDetail == null) {
                    fragmentManager?.let { fm ->
                        SearchAddressDialog.show(fm)
                    }
                }
            }

            civilarioViewModel?.objCivilario?.observe(viewLifecycleOwner, EventObserver { coj ->
                val numeroMunicipio = coj.municipio?.substring(coj.municipio.length - 1)?.toInt()
                val esponente = if (coj.esponente.isNullOrBlank()) "" else "/${coj.esponente}"
                viewModelReporting.tempIndirizzoCivilario = IndirizzoSegnaleIndicatore(
                    coj.nome_via + ", " + coj.numero + esponente +", (" + coj.municipio + ") - " + coj.localita,
                    Location(coj.lat, coj.lon),
                    numeroMunicipio,
                    coj.localita
                )
                addressValue.text = coj.nome_via + ", " + coj.numero + esponente +", (" + coj.municipio + ") - " + coj.localita
                mapFrag.retrieveAndDrawMyPositionOnMap(LatLng(coj.lat, coj.lon))
                confirmButton.isEnabled = !addressValue.text.isNullOrBlank() && !reportEditText.text.isNullOrBlank()
            })

            takePictureSignalation.setOnClickListener {
                openCamera()
            }

            imagePreviewCancel.setOnClickListener {
                removePhotoPreview()
            }

            confirmButton.setOnClickListener {
                currentLocation?.let { location ->
                    val assetReporting = AssetReporting(
                        idTag = if (tagidEditText.text.isNullOrBlank()) "" else tagidEditText.text.toString(),
                        indirizzo = viewModelReporting.tempIndirizzoCivilario,
                        mobileLocation = Location(location.latitude, location.longitude),
                        dataInserimento = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ITALIAN).format(Date()),
                        note = if (reportEditText.text.isNullOrBlank()) "" else reportEditText.text.toString(),
                        nome = if (nomeEditText.text.isNullOrBlank()) "" else capitalize(nomeEditText.text.toString()),
                        cognome = if (cognomeEditText.text.isNullOrBlank()) "" else capitalize(cognomeEditText.text.toString()),
                        telefono = if (telefonoEditText.text.isNullOrBlank()) "" else telefonoEditText.text.toString(),
                        email = if (emailEditText.text.isNullOrBlank()) "" else emailEditText.text.toString(),
                        blob = if (imageRating.size == 0) "" else imageRating[0],
                        ragioneSociale = if (ragioneSocialeEditText.text.isNullOrBlank()) "" else ragioneSocialeEditText.text.toString()
                    )
                    viewModelReporting.sendDataSignalation(assetReporting, assetDetail, utilViewModel?.userLogged).observe(viewLifecycleOwner, Observer { reportingResponse ->
                        if (reportingResponse?.status == 200) {
                            utilViewModel?.message?.value = reportingResponse.value?.result
                            dismiss()
                        } else {
                            utilViewModel?.message?.value = "Errore di connessione"
                            dismiss()
                        }
                    })
                }
            }

            reportEditText.afterTextChanged { report ->
                confirmButton.isEnabled = report.isNotEmpty() && !addressValue.text.isNullOrBlank()
            }
        }
    }

    private fun removePhotoPreview() {
        imageRating.clear()
        binding.imagePreview.visibility = View.GONE
        binding.imageCameraReporting.visibility = View.VISIBLE
    }

    private fun openCamera() {
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { takePictureIntent ->
                takePictureIntent.resolveActivity(context?.packageManager)?.also {
                    val photoFile: File? = try {
                        createImageFile()
                    } catch (e: IOException) {
                        null
                    }
                    photoFile?.also { file ->
                        Log.d(TAG, file.absolutePath)
                        photoURI = FileProvider.getUriForFile(context!!, "it.almaviva.baricittaconnessa.fileprovider", file)
                        takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
                        startActivityForResult(takePictureIntent, CAMERA_REQUEST_ACTIVITY)
                    }
                }
            }

        } else {
            checkPermission()
        }
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStampPhoto: String = SimpleDateFormat("ddMMyyyy_HHmmss").format(Date())
        //val storageDirPhoto: File = File(context?.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "BariCittaConnessa")
        val storageDirPhoto: File = requireContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES)

        if (storageDirPhoto.isDirectory) {
            val children = storageDirPhoto.list()
            for (i in children.indices) {
                File(storageDirPhoto, children[i]).delete()
            }
        }

        val filePhoto = "$storageDirPhoto/$timeStampPhoto.jpg"
        return File(filePhoto).apply {
            mCurrentPhotoPath = absolutePath
        }
    }

    private fun checkPermission() {
        if (((ContextCompat.checkSelfPermission(context!!, Manifest.permission.READ_EXTERNAL_STORAGE) + ContextCompat.checkSelfPermission(context!!, Manifest.permission.WRITE_EXTERNAL_STORAGE) + ContextCompat.checkSelfPermission(context!!, Manifest.permission.CAMERA)) != PackageManager.PERMISSION_GRANTED)) {
            if ((ActivityCompat.shouldShowRequestPermissionRationale(activity!!, Manifest.permission.READ_EXTERNAL_STORAGE) || ActivityCompat.shouldShowRequestPermissionRationale(activity!!, Manifest.permission.WRITE_EXTERNAL_STORAGE) || ActivityCompat.shouldShowRequestPermissionRationale(activity!!, Manifest.permission.CAMERA))) {
                utilViewModel?.showPermissionSnackBar?.value = "Si prega di concedere l'autorizzazione per acquisire foto ed effettuare l'archivazione"
            } else {
                requestPermissions(arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.CAMERA), PERMISSIONS_MULTIPLE_REQUEST)
            }
        } else {
            // write your logic code if permission already granted
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == CAMERA_REQUEST_ACTIVITY) {
            if (resultCode == Activity.RESULT_OK) {

                val bitmap: Bitmap = MediaStore.Images.Media.getBitmap(requireContext().contentResolver, photoURI)
                binding.imagePreview.setImageBitmap(bitmap)
                binding.imagePreview.visibility = View.VISIBLE

                imageRating.add(getStringBitmapJPEG(Utils.getScaledDownBitmap(bitmap, RESIZE_PHOTO_TO, true)))
            }
        }
    }

    private fun getStringBitmapJPEG(bmp: Bitmap): String {
        val byteArrayBitmapStream = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.JPEG, 100, byteArrayBitmapStream)
        val imageBytes = byteArrayBitmapStream.toByteArray()
        return Base64.encodeToString(imageBytes, Base64.NO_WRAP)
    }

    override fun onGeocoderTask(addresses: ArrayList<Address>) {
//        if (dialog?.isShowing == true)
//            if (addresses.isNotEmpty()) {
//                val latLng = LatLng(addresses[0].latitude, addresses[0].longitude)
//                ((childFragmentManager.findFragmentByTag(TAG_FRAGMENT_DIALOG_MAP)) as MapDialogFragment).retrieveCameraToMyPosition(latLng)
//            } else {
//                ((childFragmentManager.findFragmentByTag(TAG_FRAGMENT_DIALOG_MAP)) as MapDialogFragment).retrieveCameraToMyPosition(
//                    LatLng(
//                        currentLocation?.latitude
//                            ?: 45.465454, currentLocation?.longitude ?: 9.186516
//                    )
//                )
//                Toast.makeText(activity, "Nessun indirizzo trovato", Toast.LENGTH_LONG).show()
//            }
    }

    companion object {
        const val LOCATION = "location"
        const val ASSET_DETAIL = "ASSET_DETAIL"
        const val ASSET_REASON = "ASSET_REASON"

        const val CAMERA_REQUEST_ACTIVITY = 100
        const val PERMISSIONS_MULTIPLE_REQUEST = 123
        var imageRating: MutableList<String> = mutableListOf()

        fun show(fm: FragmentManager, location: Location, assetDetail: AssetDetail?, reason: String? = "") {
            ReportingFragment().apply {
                val args = Bundle()
                args.putParcelable(LOCATION, location)
                assetDetail?.let {
                    args.putSerializable(ASSET_DETAIL, it)
                }
                reason?.let {
                    args.putSerializable(ASSET_REASON, it)
                }
                arguments = args
            }.show(fm, "REPORTING")
        }

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
        utilViewModel?.message?.value = "Errore di connessione"
    }

    private fun EditText.afterTextChanged(afterTextChanged: (String) -> Unit) {
        this.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {
            }

            override fun onTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {
            }

            override fun afterTextChanged(editable: Editable?) {
                afterTextChanged.invoke(editable.toString())
            }
        })
    }
}