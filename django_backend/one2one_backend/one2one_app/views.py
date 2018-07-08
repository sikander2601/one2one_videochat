from django.shortcuts import render
from django.http import JsonResponse
# Create your views here.
from django.http import HttpResponse
from one2one_app.models import UserProfile, MenteeTracker, EventTracker
from django.core import serializers

def home(request):
    try:
        events = serializers.serialize('json',EventTracker.objects.only('session_id','mentor_id', 'mentee_id'))
        if request.method == 'GET':
            return events
    except:
        pass
    return 
