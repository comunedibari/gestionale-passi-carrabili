package com.zebra.rfidreader.demo.bari_citta_connessa.utils

import android.content.Context
import android.os.Build
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.databinding.BindingAdapter

/**
 * A collection of [BindingAdapter]s for different UI-related tasks.
 *
 * In Kotlin you can write the Binding Adapters in the traditional way:
 *
 * ```
 * @BindingAdapter("property")
 * @JvmStatic fun propertyMethod(view: ViewClass, parameter1: Param1, parameter2: Param2...)
 * ```
 *
 * Or using extension functions:
 *
 * ```
 * @BindingAdapter("property")
 * @JvmStatic fun ViewClass.propertyMethod(parameter1: Param1, parameter2: Param2...)
 * ```
 *
 * See [EditText.clearTextOnFocus].
 *
 * Also, keep in mind that @JvmStatic is only necessary if you define the methods inside a class or
 * object. Consider moving the Binding Adapters to the top level of the file.
 */
object BindingAdapters {

    /**
     * When defined in an [EditText], this [BindingAdapter] will clear the text on focus and
     * set the previous value if the traveler doesn't enter one. When the focus leaves, it calls
     * the listener that was passed as an argument.
     *
     * Note that `android:selectAllOnFocus="true"` does something similar but not exactly the same.
     *
     * @see [clearTextOnFocus] for a version without a listener.
     */

    /*
    @Suppress("unused")
    @BindingAdapter("clearOnFocusAndDispatch")
    @JvmStatic
    fun clearOnFocusAndDispatch(view: EditText, listener: View.OnFocusChangeListener?) {
        view.onFocusChangeListener = View.OnFocusChangeListener { focusedView, hasFocus ->
            val textView = focusedView as TextView
            if (hasFocus) {
                // Delete contents of the EditText if the focus entered.
                view.setTag(R.id.previous_value, textView.text)
                textView.text = ""
            } else {
                if (textView.text.isEmpty()) {
                    val tag: CharSequence? = textView.getTag(R.id.previous_value) as CharSequence
                    textView.text = tag ?: ""
                }
                // If the focus left, updateDataset the listener
                listener?.onFocusChange(focusedView, hasFocus)
            }
        }
    }
    */

    /**
     * Clears the text on focus.
     *
     * This method is using extension functions. It's equivalent to:
     * ```
     * @JvmStatic fun clearTextOnFocus(view: EditText, enabled: Boolean)...
     * ```
     */

    /*
    @Suppress("unused")
    @BindingAdapter("clearTextOnFocus")
    @JvmStatic
    fun EditText.clearTextOnFocus(enabled: Boolean) {
        if (enabled) {
            clearOnFocusAndDispatch(this, null)
        } else {
            this.onFocusChangeListener = null
        }
    }
    */

    /**
     * Hides keyboard when the [EditText] is focused.
     *
     * Note that there can only be one [TextView.OnEditorActionListener] on each [EditText] and
     * this [BindingAdapter] sets it.
     */
    @BindingAdapter("hideKeyboardOnInputDone")
    @JvmStatic
    fun hideKeyboardOnInputDone(view: EditText, enabled: Boolean) {
        if (!enabled) return
        val listener = TextView.OnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                view.clearFocus()
                val imm = view.context.getSystemService(Context.INPUT_METHOD_SERVICE)
                        as InputMethodManager
                imm.hideSoftInputFromWindow(view.windowToken, 0)
            }
            false
        }
        view.setOnEditorActionListener(listener)
    }

    /*
     * Instead of having if-else statements in the XML layout, you can create your own binding
     * adapters, making the layout easier to read.
     *
     * Instead of
     *
     * `android:visibility="@{viewmodel.isStopped ? View.INVISIBLE : View.VISIBLE}"`
     *
     * you use:
     *
     * `android:invisibleUnless="@{viewmodel.isStopped}"`
     *
     */

    /**
     * Makes the View [View.INVISIBLE] unless the condition is met.
     */
    @Suppress("unused")
    @BindingAdapter("invisibleUnless")
    @JvmStatic
    fun invisibleUnless(view: View, visible: Boolean) {
        view.visibility = if (visible) View.VISIBLE else View.INVISIBLE
    }

    /**
     * Makes the View [View.GONE] unless the condition is met.
     */
    @Suppress("unused")
    @BindingAdapter("goneUnless")
    @JvmStatic
    fun goneUnless(view: View, visible: Boolean) {
        view.visibility = if (visible) View.VISIBLE else View.GONE
    }

    /**
     * Makes the View [View.GONE] unless the condition is met.
     */
    @Suppress("unused")
    @BindingAdapter("isVisible")
    @JvmStatic
    fun visibleUnless(view: View, visible: Boolean) {
        view.visibility = if (visible) View.VISIBLE else View.GONE
    }

    /**
     * Makes the View [View.GONE] unless the condition is met.
     */
    @Suppress("unused")
    @BindingAdapter("isPrm")
    @JvmStatic
    fun isPrm(view: View, prm: Int) {
        view.visibility = if (prm == 1) View.VISIBLE else View.GONE
    }

    /**
     * Makes delayFormat.
     */
    @Suppress("unused")
    @BindingAdapter("delayFormat")
    @JvmStatic
    fun TextView.delayFormat(dateRaw: String?) {

        text = if(dateRaw != null)
                    if(dateRaw != "RIT")
                        "+$dateRaw min"
                    else "RIT"
                else ""
    }

    /**
     * Makes the View [View.GONE] unless the condition is met.
     */
    @Suppress("unused")
    @BindingAdapter("delayIsVisible")
    @JvmStatic
    fun delayIsVisible(view: View, dateRaw: String?) {
        view.visibility = if (dateRaw.isNullOrEmpty()) View.GONE else View.VISIBLE
    }

    /**
     * In [ProgressBar], [ProgressBar.setMax] must be called before [ProgressBar.setProgress].
     * By grouping both attributes in a BindingAdapter we can make sure the order is met.
     *
     * Also, this showcases how to deal with multiple API levels.
     */
    @BindingAdapter(value = ["android:max", "android:progress"], requireAll = true)
    @JvmStatic
    fun updateProgress(progressBar: ProgressBar, max: Int, progress: Int) {
        progressBar.max = max
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            progressBar.setProgress(progress, false)
        } else {
            progressBar.progress = progress
        }
    }

    @BindingAdapter("loseFocusWhen")
    @JvmStatic
    fun loseFocusWhen(view: EditText, condition: Boolean) {
        if (condition) view.clearFocus()
    }
}
