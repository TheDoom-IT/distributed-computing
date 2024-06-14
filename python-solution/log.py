


def log(*objects, file="eventLog"):
	f = open("logs/"+file+".txt", "a")
	print("\n\n"+"".join(map(str,objects)), file= f)
	f.close()