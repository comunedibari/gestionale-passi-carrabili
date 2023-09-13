{{/*
Expand the name of the chart.
*/}}
{{- define "gpc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "gpc.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "gpc.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "gpc.labels" -}}
helm.sh/chart: {{ include "gpc.chart" . }}
app.kubernetes.io/name: {{ include "gpc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Common labels for back end
*/}}
{{- define "gpc.labelsBackEnd" -}}
helm.sh/chart: {{ include "gpc.chart" . }}
{{ include "gpc.selectorLabelsBackEnd" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels for back end
*/}}
{{- define "gpc.selectorLabelsBackEnd" -}}
app.kubernetes.io/name: {{ include "gpc.name" . }}-be
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels for front end
*/}}
{{- define "gpc.labelsFrontEnd" -}}
helm.sh/chart: {{ include "gpc.chart" . }}
{{ include "gpc.selectorLabelsFrontEnd" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}


{{/*
Selector labels for front end
*/}}
{{- define "gpc.selectorLabelsFrontEnd" -}}
app.kubernetes.io/name: {{ include "gpc.name" . }}-fe
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


{{/*
Create the name of the service account to use
*/}}
{{- define "gpc.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "gpc.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
