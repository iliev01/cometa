# author : Anand Kushwaha
# version : 10.0.0
# date : 2024-07-11

from django.contrib import admin
from .models import *


class HouseKeepingLogsAdmin(admin.ModelAdmin):
    model = HouseKeepingLogs
    search_fields = ['id', 'created_on', 'list_files_to_clean']
    list_display = ('id', 'created_on', 'success', 'approved_by')
    list_filter = ('success',)
    readonly_fields = ('approved_by', 'created_on','success')

admin.site.register(HouseKeepingLogs, HouseKeepingLogsAdmin)
