import duckdb

conn = duckdb.connect(database='./LOCAL/Resources/argo.db')

tables = conn.execute("Select count() from argo2023_slim;").fetchdf()
print("Tables in the database:")
print(tables)