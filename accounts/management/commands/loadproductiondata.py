from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Load production data from datadump.json'

    def handle(self, *args, **kwargs):
        self.stdout.write('Loading data...')
        call_command('loaddata', 'datadump.json')
        self.stdout.write(self.style.SUCCESS('Data loaded successfully!'))