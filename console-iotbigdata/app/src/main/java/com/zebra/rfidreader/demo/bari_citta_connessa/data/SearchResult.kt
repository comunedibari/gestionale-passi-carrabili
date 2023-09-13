package com.zebra.rfidreader.demo.bari_citta_connessa.data

sealed class SearchResult
class ValidResult(val result: List<AssetDetail>) : SearchResult()
class EmptyResult(val result: List<AssetDetail>) : SearchResult()
object EmptyQuery : SearchResult()
class ErrorResult(val e: Throwable) : SearchResult()
object TerminalError : SearchResult()