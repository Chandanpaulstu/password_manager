<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VaultEntry;
use Illuminate\Http\Request;

class VaultController extends Controller
{
    public function index(Request $request)
    {
        $entries = VaultEntry::where('user_id', $request->user()->id)
            ->select('id','title_encrypted','iv','category','created_at','updated_at')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($entries);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title_encrypted' => 'required|string|max:512',
            'data_encrypted'  => 'required|string',
            'iv'              => 'required|string|max:64',
            'category'        => 'required|in:login,card,note,identity',
        ]);

        $entry = VaultEntry::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($entry, 201);
    }

    public function show(Request $request, VaultEntry $vault)
    {
        $this->authorizeEntry($vault, $request->user()->id);
        return response()->json($vault);
    }

    public function update(Request $request, VaultEntry $vault)
    {
        $this->authorizeEntry($vault, $request->user()->id);

        $data = $request->validate([
            'title_encrypted' => 'required|string|max:512',
            'data_encrypted'  => 'required|string',
            'iv'              => 'required|string|max:64',
            'category'        => 'required|in:login,card,note,identity',
        ]);

        $vault->update($data);
        return response()->json($vault);
    }

    public function destroy(Request $request, VaultEntry $vault)
    {
        $this->authorizeEntry($vault, $request->user()->id);
        $vault->delete();
        return response()->json(['message' => 'Entry deleted.']);
    }

    private function authorizeEntry(VaultEntry $vault, int $userId): void
    {
        abort_if($vault->user_id !== $userId, 403, 'Forbidden.');
    }
}
