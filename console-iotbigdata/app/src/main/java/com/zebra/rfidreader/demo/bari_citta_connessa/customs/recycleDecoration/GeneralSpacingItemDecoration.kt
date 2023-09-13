package com.zebra.rfidreader.demo.bari_citta_connessa.customs.recycleDecoration

import android.graphics.Rect
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.view.View


class GeneralSpacingItemDecoration(private val spacing: Int, private var displayMode: Int = -1) : androidx.recyclerview.widget.RecyclerView.ItemDecoration() {


    override fun getItemOffsets(outRect: Rect, view: View, parent: androidx.recyclerview.widget.RecyclerView, state: androidx.recyclerview.widget.RecyclerView.State) {
        val position = parent.getChildViewHolder(view).adapterPosition
        val itemCount = state.itemCount
        val layoutManager = parent.layoutManager
        setSpacingForDirection(outRect, layoutManager, position, itemCount)
    }

    private fun setSpacingForDirection(outRect: Rect, layoutManager: androidx.recyclerview.widget.RecyclerView.LayoutManager?, position: Int, itemCount: Int) {

        // Resolve display mode automatically
        if (displayMode == -1) {
            displayMode = resolveDisplayMode(layoutManager)
        }

        when (displayMode) {
            HORIZONTAL -> {
                outRect.left = spacing
                outRect.right = if (position == itemCount - 1) spacing else 0
                outRect.top = spacing
                outRect.bottom = spacing
            }
            VERTICAL -> {
                outRect.left = spacing
                outRect.right = spacing
                outRect.top = spacing
                outRect.bottom = if (position == itemCount - 1) spacing else 0
            }
            HORIZONTAL_SCROLL -> {
                outRect.left = spacing
                outRect.right = if (position == itemCount - 1) spacing else 0
                outRect.top = 0
                outRect.bottom = 0
                println("position: $position, itemCount: $itemCount")
            }
            GRID -> if (layoutManager is androidx.recyclerview.widget.GridLayoutManager) {
                val gridLayoutManager = layoutManager as androidx.recyclerview.widget.GridLayoutManager?
                val cols = gridLayoutManager!!.spanCount
                val rows = itemCount / cols

                outRect.left = spacing
                outRect.right = if (position % cols == cols - 1) spacing else 0
                outRect.top = spacing
                outRect.bottom = if (position / cols == rows - 1) spacing else 0
            }
        }
    }

    private fun resolveDisplayMode(layoutManager: androidx.recyclerview.widget.RecyclerView.LayoutManager?): Int {
        if (layoutManager is androidx.recyclerview.widget.GridLayoutManager) return GRID
        return if (layoutManager!!.canScrollHorizontally()) HORIZONTAL else VERTICAL
    }

    companion object {

        const val HORIZONTAL        = 0
        const val VERTICAL          = 1
        const val GRID              = 2
        const val HORIZONTAL_SCROLL = 3
    }
}