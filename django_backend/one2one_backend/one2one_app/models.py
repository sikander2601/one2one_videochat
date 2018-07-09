from django.db import models
import uuid

# Create your models here.
class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    mobile_number = models.CharField(max_length=20, null=True, blank=True, unique=True)
    gender = models.CharField(max_length=20, choices=(('M', 'male'), ('F', 'female'), ('O', 'others')))

class MenteeTracker(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    mobile_number = models.CharField(max_length=20, null=True, blank=True, unique=True)
    gender = models.CharField(max_length=20, choices=(('M', 'male'), ('F', 'female'), ('O', 'others')))

class EventTracker(models.Model):
    session_id = models.AutoField(primary_key=True)
    mentor_id = models.ForeignKey(UserProfile)
    start_date_time = models.DateTimeField(null = True)
    end_date_time = models.DateTimeField(null = True)
    topic = models.CharField(null = True,max_length = 200)
    description = models.CharField(null = True,max_length = 500)
    capacity = models.IntegerField(null=True)
    attendance = models.IntegerField(null=True)
    is_school_community = models.BooleanField(default = True)
    status = models.CharField(max_length=20, choices=(('Scheduled', 'S'), ('Ongoing', 'O'), ('Done', 'D'), ('Cancelled', 'C')))
    event_type = models.CharField(max_length=30, null=True)  # one2one , one2many or many2many
    event_url = models.URLField(null=True, blank=True)   # may be empty
    mentee_id = models.ForeignKey(MenteeTracker)

    def natural_key(self):
        model_to_dict = self.__dict__
        user_profile_dict = UserProfile.objects.get(id = self.mentor_id.id).__dict__
        # model_to_dict.pop('session_id')
        model_to_dict.pop('_state')
        model_to_dict.pop('_mentor_id_cache')
        user_profile_dict.pop('_state')
        model_to_dict['mentor_id'] = user_profile_dict
        return model_to_dict

    def __str__(self):
        return self.mentor_id.first_name + "    " +str(self.topic)

class Webinar_Conversation(models.Model):
    session_id = models.ForeignKey(EventTracker,db_index=True)
    participant = models.ForeignKey(UserProfile)
    creation_time = models.DateTimeField(auto_now=False,auto_now_add=True)
    conversation = models.TextField(null=True,blank=True)
    comments = models.CharField(max_length=100, null=True,blank=True)
