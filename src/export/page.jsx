const handleDownload = async () => {
    try {
      const blob = await await fetch("http://35.154.85.104:8085/api/admin/export-excel");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ExcelExport.xlsx;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      
    }
  };