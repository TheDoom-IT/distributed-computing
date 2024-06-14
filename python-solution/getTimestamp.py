from datetime import datetime, timedelta


def getTimestamp(minutes = 0):
	return int(datetime.timestamp(datetime.now() + timedelta(minutes = minutes)) * 1000)