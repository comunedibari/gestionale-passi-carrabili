package com.zebra.rfidreader.demo.bari_citta_connessa.customs.bottomSheet

import android.content.Context
import com.google.android.material.bottomsheet.BottomSheetBehavior
import androidx.coordinatorlayout.widget.CoordinatorLayout
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View


class CustomBottomSheetPhoneBehavior<V : View> : BottomSheetBehavior<V> {
    private var mAllowUserDragging = true

    /**
     * Default constructor for instantiating BottomSheetBehaviors.
     */
    constructor() : super()

    /**
     * Default constructor for inflating BottomSheetBehaviors from layout.
     *
     * @param context The [Context].
     * @param attrs   The [AttributeSet].
     */
    constructor(context: Context, attrs: AttributeSet) : super(context, attrs)

    fun setAllowUserDragging(allowUserDragging: Boolean) {
        mAllowUserDragging = allowUserDragging
    }

    override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: V, event: MotionEvent): Boolean {
        return if (!mAllowUserDragging) {
            false
        } else super.onInterceptTouchEvent(parent, child, event)
    }
}